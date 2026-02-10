#!/bin/bash

# ============================================
# Guschlbauer Signatures - Hetzner Setup Script
# ============================================
#
# Verwendung:
# 1. Neuen Hetzner VPS erstellen (Ubuntu 22.04 oder 24.04)
# 2. SSH: ssh root@YOUR_IP
# 3. Dieses Script hochladen und ausführen:
#    curl -O https://raw.githubusercontent.com/your-repo/setup-hetzner.sh
#    chmod +x setup-hetzner.sh
#    ./setup-hetzner.sh
#
# ============================================

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Guschlbauer Signatures - Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# ============================================
# 1. System aktualisieren
# ============================================
echo -e "\n${YELLOW}[1/7] System aktualisieren...${NC}"
apt update && apt upgrade -y

# ============================================
# 2. Docker installieren
# ============================================
echo -e "\n${YELLOW}[2/7] Docker installieren...${NC}"

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Docker Compose Plugin
    apt install -y docker-compose-plugin

    # Docker ohne sudo
    usermod -aG docker $USER

    echo -e "${GREEN}Docker installiert!${NC}"
else
    echo -e "${GREEN}Docker bereits installiert.${NC}"
fi

# ============================================
# 3. Firewall konfigurieren
# ============================================
echo -e "\n${YELLOW}[3/7] Firewall konfigurieren...${NC}"

apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo -e "${GREEN}Firewall konfiguriert (SSH, HTTP, HTTPS erlaubt)${NC}"

# ============================================
# 4. Projektverzeichnis erstellen
# ============================================
echo -e "\n${YELLOW}[4/7] Projektverzeichnis erstellen...${NC}"

mkdir -p /opt/guschlbauer-signatures
cd /opt/guschlbauer-signatures

echo -e "${GREEN}Verzeichnis: /opt/guschlbauer-signatures${NC}"

# ============================================
# 5. Domain abfragen
# ============================================
echo -e "\n${YELLOW}[5/7] Domain konfigurieren...${NC}"

read -p "Domain eingeben (z.B. signatures.guschlbauer.at): " DOMAIN
read -p "E-Mail für Let's Encrypt: " SSL_EMAIL

# Domain in nginx.conf ersetzen
if [ -f "nginx/nginx.conf" ]; then
    sed -i "s/signatures.guschlbauer.at/$DOMAIN/g" nginx/nginx.conf
fi

# ============================================
# 6. Environment Variables
# ============================================
echo -e "\n${YELLOW}[6/7] Environment Variables konfigurieren...${NC}"

if [ ! -f ".env" ]; then
    cat > .env << EOF
# Domain & SSL
DOMAIN=$DOMAIN
SSL_EMAIL=$SSL_EMAIL
APP_URL=https://$DOMAIN

# Azure AD (nach App-Registrierung ausfüllen)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# NEXT_PUBLIC_* (werden zur Build-Zeit eingebettet)
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=
NEXT_PUBLIC_AZURE_AD_TENANT_ID=

# CORS - erlaubte Origins (kommagetrennt)
ALLOWED_ORIGINS=https://$DOMAIN

# Dev Mode (auf false lassen für Produktion)
DEV_MODE=false
EOF

    echo -e "${GREEN}.env Datei erstellt${NC}"
    echo -e "${YELLOW}WICHTIG: Azure AD Credentials in .env eintragen!${NC}"
else
    echo -e "${GREEN}.env existiert bereits${NC}"
fi

# ============================================
# 7. SSL Zertifikat
# ============================================
echo -e "\n${YELLOW}[7/7] SSL Zertifikat erstellen...${NC}"

mkdir -p nginx/ssl

# Temporäre nginx config ohne SSL für ersten certbot Lauf
cat > nginx/nginx-initial.conf << 'EOF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'Guschlbauer Signatures - Setup in progress';
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Certbot ausführen
docker run --rm \
    -v /opt/guschlbauer-signatures/nginx/ssl:/etc/letsencrypt \
    -v /opt/guschlbauer-signatures/certbot-webroot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo -e "${GREEN}SSL Zertifikat erstellt!${NC}"

# ============================================
# Fertig
# ============================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup abgeschlossen!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Nächste Schritte:"
echo -e "1. ${YELLOW}nano .env${NC} - Azure AD Credentials eintragen"
echo -e "2. ${YELLOW}docker compose up -d${NC} - Server starten"
echo -e "3. ${YELLOW}docker compose logs -f${NC} - Logs prüfen"
echo ""
echo -e "Die Anwendung ist dann erreichbar unter:"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo ""
