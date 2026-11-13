#!/usr/bin/env bash

INSTALL_DIR="/usr/local/sanaei-bridge"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PLAIN='\033[0m'

show_menu() {
    clear
    echo -e "${CYAN}================================================================${PLAIN}"
    echo -e "${GREEN}    Modiriat Panel Cheshmak & Pole Ertebatie Application        ${PLAIN}"
    echo -e "${CYAN}================================================================${PLAIN}"
    echo -e " ${GREEN}1.${PLAIN} Vaziate Service (Status)"
    echo -e " ${GREEN}2.${PLAIN} Rah-andazi Mojaddad (Restart)"
    echo -e " ${GREEN}3.${PLAIN} Tavaghofe Service (Stop)"
    echo -e " ${GREEN}4.${PLAIN} Shorou-e Service (Start)"
    echo -e " ${GREEN}5.${PLAIN} Moshahedeye Log-haye Zende (Logs)"
    echo -e " ${GREEN}6.${PLAIN} Beroozresani Khodkar be Akharin Noskhe (Update)"
    echo -e " ${GREEN}7.${PLAIN} Tanzime Domain & SSL Rayegan Certbot"
    echo -e " ${GREEN}8.${PLAIN} Taghyire Porte Barname (Change Port)"
    echo -e " ${RED}9.${PLAIN} Hazfe Kamele Barname (Uninstall)"
    echo -e " ${YELLOW}0.${PLAIN} Khorooj (Exit)"
    echo -e "${CYAN}================================================================${PLAIN}"
    read -p "Lotfan yek gozine ra entekhab konid [0-9]: " choice
    case $choice in
        1)
            systemctl status sanaei-bridge
            ;;
        2)
            systemctl restart sanaei-bridge
            echo -e "${GREEN}Service ba movafaghiat restart shod.${PLAIN}"
            ;;
        3)
            systemctl stop sanaei-bridge
            echo -e "${YELLOW}Service motavaghef shod.${PLAIN}"
            ;;
        4)
            systemctl start sanaei-bridge
            echo -e "${GREEN}Service shoroo be kar kard.${PLAIN}"
            ;;
        5)
            echo -e "${CYAN}Baraye khorooj az log kelidhaye Ctrl+C ra feshar dahid...${PLAIN}"
            journalctl -u sanaei-bridge -f
            ;;
        6)
            echo -e "${CYAN}Dar hale daryafte akharin noskheye Panel Cheshmak (Server & Frontend)...${PLAIN}"
            mkdir -p "$INSTALL_DIR"
            cd "$INSTALL_DIR" || exit
            LIVE_URL="https://ais-pre-ntugzaszszyeqscuwuvvxb-481941350957.europe-west1.run.app"
            
            # 1. Try pulling from GitHub if connected
            git pull > /dev/null 2>&1 || true

            # 2. Download pre-built frontend + server bundle (dist.tar.gz) and extract into dist/
            echo -e "${YELLOW}[1/3] Daryafte بسته کامل رابط کاربری و هسته سرور (dist.tar.gz)...${PLAIN}"
            mkdir -p "${INSTALL_DIR}/dist"
            if curl -fsSL "${LIVE_URL}/dist.tar.gz" -o /tmp/cheshmak-dist.tar.gz 2>/dev/null; then
                tar -xzf /tmp/cheshmak-dist.tar.gz -C "${INSTALL_DIR}/dist"
                rm -f /tmp/cheshmak-dist.tar.gz
                if [ -s "${INSTALL_DIR}/dist/server.js" ]; then
                    cp -f "${INSTALL_DIR}/dist/server.js" "${INSTALL_DIR}/server.js"
                fi
                echo -e "${GREEN}File-haye frontend (dist) va server.js ba movafaghiat estekhraj shod.${PLAIN}"
            elif [ -f "${INSTALL_DIR}/public/dist.tar.gz" ]; then
                tar -xzf "${INSTALL_DIR}/public/dist.tar.gz" -C "${INSTALL_DIR}/dist"
                if [ -s "${INSTALL_DIR}/dist/server.js" ]; then
                    cp -f "${INSTALL_DIR}/dist/server.js" "${INSTALL_DIR}/server.js"
                fi
            fi

            # 3. Also download latest server.js directly
            echo -e "${YELLOW}[2/3] Beroozresani haste server (server.js)...${PLAIN}"
            if curl -fsSL "${LIVE_URL}/server.js" -o "${INSTALL_DIR}/server.js.new" 2>/dev/null; then
                if [ -s "${INSTALL_DIR}/server.js.new" ]; then
                    mv -f "${INSTALL_DIR}/server.js.new" "${INSTALL_DIR}/server.js"
                    echo -e "${GREEN}File server.js ba movafaghiat berooz shod.${PLAIN}"
                fi
            fi
            sed -i 's/.*from ["'"'"']vite["'"'"'].*//g' "${INSTALL_DIR}/server.js" 2>/dev/null || true

            # 4. Also self-update CLI script
            curl -fsSL "${LIVE_URL}/sanaei-bridge.sh" -o /usr/local/bin/sanaei-bridge 2>/dev/null && chmod +x /usr/local/bin/sanaei-bridge || true

            # 5. Restart systemd service
            echo -e "${YELLOW}[3/3] Rah-andazi mojaddade service...${PLAIN}"
            systemctl restart sanaei-bridge
            sleep 1
            echo -e "${GREEN}================================================================${PLAIN}"
            echo -e "${GREEN}   Beroozresani be akharin noskhe ba movafaghiat anjam shod!    ${PLAIN}"
            echo -e "${GREEN}================================================================${PLAIN}"
            ;;
        7)
            read -p "Domain ya subdomain ra vared konid (masalan api.example.com): " DOMAIN_NAME
            if [ -n "$DOMAIN_NAME" ]; then
                apt-get install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1 || yum install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
                cat > /etc/nginx/conf.d/${DOMAIN_NAME}.conf << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    client_max_body_size 200M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX_EOF
                nginx -t && systemctl restart nginx
                certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
                echo -e "${GREEN}Domain ba SSL rooye https://${DOMAIN_NAME} set shod!${PLAIN}"
            fi
            ;;
        8)
            read -p "Porte jadid ra vared konid: " NEW_PORT
            if [ -n "$NEW_PORT" ]; then
                sed -i "s/Environment=PORT=.*/Environment=PORT=${NEW_PORT}/g" /etc/systemd/system/sanaei-bridge.service
                systemctl daemon-reload
                systemctl restart sanaei-bridge
                echo -e "${GREEN}Port ba movafaghiat be ${NEW_PORT} taghyir yaft.${PLAIN}"
            fi
            ;;
        9)
            read -p "Aya motmaen hastid ke mikhahid panel ra kamel hazf konid? [y/N]: " confirm
            if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
                systemctl stop sanaei-bridge
                systemctl disable sanaei-bridge
                rm -f /etc/systemd/system/sanaei-bridge.service
                systemctl daemon-reload
                rm -rf "$INSTALL_DIR"
                rm -f /usr/local/bin/sanaei-bridge
                echo -e "${GREEN}Panel ba movafaghiat hazf shod.${PLAIN}"
                exit 0
            fi
            ;;
        0)
            exit 0
            ;;
        *)
            echo -e "${RED}Gozineye namotabar ast!${PLAIN}"
            ;;
    esac
}

show_menu
