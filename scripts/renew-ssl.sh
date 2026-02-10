#!/bin/bash

# Let's Encrypt Auto-Renewal
# In crontab eintragen: 0 3 * * * /opt/guschlbauer-signatures/scripts/renew-ssl.sh

cd /opt/guschlbauer-signatures

docker compose run --rm certbot renew --quiet

docker compose exec nginx nginx -s reload
