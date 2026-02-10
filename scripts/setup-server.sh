#!/bin/bash

#############################################
# Guschlbauer Signatures - Server Setup
# Für Ubuntu 22.04/24.04 auf Hetzner
#############################################

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Guschlbauer Signature Manager Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Variablen abfragen
read -p "Domain (z.B. signatures.guschlbauer.at): " DOMAIN
read -p "SSL E-Mail (für Let's Encrypt): " SSL_EMAIL
read -p "Azure AD Client ID: " AZURE_AD_CLIENT_ID
read -sp "Azure AD Client Secret: " AZURE_AD_CLIENT_SECRET
echo
read -p "Azure AD Tenant ID: " AZURE_AD_TENANT_ID

# API Secret generieren
API_SECRET=$(openssl rand -hex 32)

echo -e "\n${YELLOW}1. System aktualisieren...${NC}"
apt update && apt upgrade -y

echo -e "\n${YELLOW}2. Docker installieren...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

echo -e "\n${YELLOW}3. Docker Compose installieren...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose-plugin
fi

echo -e "\n${YELLOW}4. Firewall konfigurieren...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "\n${YELLOW}5. Projektverzeichnis erstellen...${NC}"
mkdir -p /opt/guschlbauer-signatures
cd /opt/guschlbauer-signatures

echo -e "\n${YELLOW}6. .env Datei erstellen...${NC}"
cat > .env << EOF
# Domain & SSL
DOMAIN=${DOMAIN}
SSL_EMAIL=${SSL_EMAIL}
APP_URL=https://${DOMAIN}

# Azure AD
AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}

# API Security
API_SECRET=${API_SECRET}

# Development Mode (false für Production)
DEV_MODE=false
EOF

chmod 600 .env

echo -e "\n${YELLOW}7. Nginx Config mit Domain erstellen...${NC}"
sed "s/\${DOMAIN}/${DOMAIN}/g" nginx/conf.d/app.conf.template > nginx/conf.d/app.conf.tmp

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup abgeschlossen!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Nächste Schritte:"
echo -e "1. Projekt-Dateien nach /opt/guschlbauer-signatures kopieren"
echo -e "2. DNS A-Record setzen: ${DOMAIN} → $(curl -s ifconfig.me)"
echo -e "3. SSL Zertifikat erstellen:"
echo -e "   ${YELLOW}docker compose up -d nginx${NC}"
echo -e "   ${YELLOW}docker compose run --rm certbot${NC}"
echo -e "4. Nginx mit SSL Config neustarten:"
echo -e "   ${YELLOW}mv nginx/conf.d/app.conf.tmp nginx/conf.d/app.conf${NC}"
echo -e "   ${YELLOW}rm nginx/conf.d/default.conf${NC}"
echo -e "   ${YELLOW}docker compose restart nginx${NC}"
echo -e "5. App starten:"
echo -e "   ${YELLOW}docker compose up -d${NC}"
echo
echo -e "API Secret (für Add-In Auth): ${YELLOW}${API_SECRET}${NC}"
echo -e "Speichere diesen Wert sicher!"
