#!/usr/bin/env bash

# ==============================================================================
# Sanaei Panel Manager & Mobile Bridge API - Automated Installer
# GitHub: https://github.com/disslove1993/panel
# Supported OS: Ubuntu 20.04+, Debian 11+, CentOS 8+, AlmaLinux, Rocky Linux
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
PLAIN='\033[0m'

INSTALL_DIR="/usr/local/sanaei-bridge"
REPO_URL="https://github.com/disslove1993/panel.git"
DEFAULT_PORT=3000

clear
echo -e "${CYAN}================================================================${PLAIN}"
echo -e "${GREEN}      Sanaei Panel Manager & Mobile App Bridge Installer        ${PLAIN}"
echo -e "${GREEN}         Nasbe Khodkare Panel Sanaei & Pole Ertebatie App       ${PLAIN}"
echo -e "${CYAN}================================================================${PLAIN}"
echo ""

# 1. Check Root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[ERROR] In script bayad ba dastresi root ejra shavad!${PLAIN}"
    echo -e "Lotfan ba dasture ${YELLOW}sudo -i${PLAIN} be karbare root beravid va mojadadan ejra konid."
    exit 1
fi

# 2. Detect OS & Package Manager
OS_TYPE=""
PKG_MGR=""

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_TYPE=$ID
fi

case "$OS_TYPE" in
    ubuntu|debian)
        PKG_MGR="apt-get"
        ;;
    centos|rhel|almalinux|rocky)
        PKG_MGR="yum"
        ;;
    fedora)
        PKG_MGR="dnf"
        ;;
    *)
        PKG_MGR="apt-get"
        ;;
esac

echo -e "${BLUE}[1/6] System-amel shenasaee shod: ${GREEN}${OS_TYPE}${PLAIN}"

# 3. Update repositories and install base packages + Android APK Builder tools
echo -e "${BLUE}[2/6] Dar hale nasbe bastehaye paye va abzarhaye sakhte APK (apktool, zipalign, apksigner)...${PLAIN}"
if [[ "$PKG_MGR" == "apt-get" ]]; then
    apt-get update -y
    apt-get install -y curl wget git tar socat systemd net-tools build-essential > /dev/null 2>&1
    echo -e "${YELLOW}Nasbe abzarhaye APK Builder: default-jre apktool zipalign apksigner...${PLAIN}"
    apt-get install -y default-jre apktool zipalign apksigner || {
        echo -e "${RED}[WARNING] Nasbe barkhi abzarhaye APK ba khata movajeh shod. Dar hale talashe mojadad...${PLAIN}"
        apt-get update -y && apt-get install -y --fix-missing default-jre apktool zipalign apksigner || true
    }
elif [[ "$PKG_MGR" == "yum" || "$PKG_MGR" == "dnf" ]]; then
    $PKG_MGR update -y > /dev/null 2>&1
    $PKG_MGR install -y curl wget git tar socat systemd net-tools gcc gcc-c++ make > /dev/null 2>&1
    $PKG_MGR install -y java-17-openjdk-headless apktool android-tools || true
fi

# 4. Check & Install Node.js 20+ LTS
echo -e "${BLUE}[3/6] Barresi noskhe Node.js...${PLAIN}"
NEED_NODE_INSTALL=true

if command -v node > /dev/null 2>&1; then
    NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "$NODE_VER" -ge 20 ]; then
        echo -e "${GREEN}Node.js noskhe $(node -v) ghablan nasb shode va motabar ast.${PLAIN}"
        NEED_NODE_INSTALL=false
    else
        echo -e "${YELLOW}Noskhe feli Node.js ($(node -v)) ghadimi ast. Ertegha be Node.js 20 LTS...${PLAIN}"
    fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
    echo -e "${YELLOW}Dar hale nasbe Node.js 20.x LTS...${PLAIN}"
    if [[ "$PKG_MGR" == "apt-get" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y nodejs > /dev/null 2>&1
    elif [[ "$PKG_MGR" == "yum" || "$PKG_MGR" == "dnf" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        $PKG_MGR install -y nodejs > /dev/null 2>&1
    fi
fi

echo -e "${GREEN}Node.js: $(node -v) | npm: $(npm -v)${PLAIN}"

# 5. Clone or Download Repository
echo -e "${BLUE}[4/6] Daryafte akharin file-haye panel...${PLAIN}"

# Check if current directory already has package.json and server.ts
if [ -f "./server.ts" ] && [ -f "./package.json" ]; then
    echo -e "${YELLOW}Script daroone poosheye source ejra shode. Copy file-ha be ${INSTALL_DIR}...${PLAIN}"
    mkdir -p "$INSTALL_DIR"
    cp -ru ./* "$INSTALL_DIR/" 2>/dev/null || true
else
    # Clean previous directory if exists to prevent git clone collision
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    mkdir -p "$INSTALL_DIR"
    DOWNLOAD_SUCCESS=false

    # Try Git Clone from GitHub first
    echo -e "Dar hale barresi va daryaft az GitHub (${REPO_URL})..."
    if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
        if [ -f "$INSTALL_DIR/package.json" ]; then
            DOWNLOAD_SUCCESS=true
            echo -e "${GREEN}File-haye source ba movafaghiat az GitHub daryaft shod.${PLAIN}"
        fi
    fi

    # Fallback to direct bundle download from AI Studio
    if [ "$DOWNLOAD_SUCCESS" = false ]; then
        echo -e "${YELLOW}Clone az GitHub anjam nashod (repo vojood nadarad ya khali ast).${PLAIN}"
        echo -e "${CYAN}Dar hale daryafte mostaghim az servere fa'al...${PLAIN}"
        mkdir -p "$INSTALL_DIR"
        if curl -fsSL "https://ais-pre-ntugzaszszyeqscuwuvvxb-481941350957.europe-west1.run.app/source.tar.gz" -o /tmp/sanaei-bundle.tar.gz 2>/dev/null; then
            tar -xzf /tmp/sanaei-bundle.tar.gz -C "$INSTALL_DIR"
            if [ -f "$INSTALL_DIR/package.json" ]; then
                DOWNLOAD_SUCCESS=true
                echo -e "${GREEN}Package kamel ba movafaghiat daryaft va dar server mostaghar shod!${PLAIN}"
                # Initialize git repo in the installed directory
                cd "$INSTALL_DIR"
                git init > /dev/null 2>&1 || true
                git remote add origin "$REPO_URL" > /dev/null 2>&1 || true
            fi
        fi
    fi

    # If still not downloaded, prompt user
    if [ "$DOWNLOAD_SUCCESS" = false ]; then
        echo -e "${YELLOW}Daryafte khodkar anjam nashod. Lotfan adrese delkhah ra vared konid:${PLAIN}"
        read -p "Adrese Git Repo ya linke tar.gz: " USER_REPO
        if [ -n "$USER_REPO" ]; then
            git clone "$USER_REPO" "$INSTALL_DIR" || {
                curl -fsSL "$USER_REPO" -o /tmp/custom.tar.gz && tar -xzf /tmp/custom.tar.gz -C "$INSTALL_DIR"
            }
        fi
    fi
fi

cd "$INSTALL_DIR" || exit 1

# 6. Ask for Port
echo ""
echo -e "${CYAN}Tanzime porte ejraye panel:${PLAIN}"
read -p "Porte morede nazar baraye panel [Pishfarz 3000]: " USER_PORT
USER_PORT=${USER_PORT:-$DEFAULT_PORT}

# 7. Install NPM Dependencies & Build
echo -e "${BLUE}[5/6] Nasbe package-haye npm va build file-haye frontend...${PLAIN}"
npm install --legacy-peer-deps

echo -e "Dar hale barrasi file-haye frontend dist..."
if [ -f "public/dist.tar.gz" ]; then
    mkdir -p dist
    tar -xzf public/dist.tar.gz -C dist/ || true
fi
if [ ! -f "dist/index.html" ]; then
    echo -e "${YELLOW}Daryafte noskheye amadeye frontend dist...${PLAIN}"
    mkdir -p dist
    curl -fsSL https://raw.githubusercontent.com/disslove1993/panel/main/public/dist.tar.gz | tar -xz -C dist || true
fi
if [ ! -f "dist/index.html" ]; then
    npm run build || true
fi

echo -e "Dar hale sakhte server.js bedone niaze be AVX..."
npx -y esbuild-wasm server.ts --bundle --platform=node --format=esm --packages=external --outfile=server.js || true


# 8. Create Systemd Service
echo -e "${BLUE}[6/6] Ijad va fa'alsazi service systemd...${PLAIN}"

NODE_PATH=$(which node)
NPM_PATH=$(which npm)

cat > /etc/systemd/system/sanaei-bridge.service << EOF
[Unit]
Description=Sanaei Panel Manager & Mobile App Bridge API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
Environment=PORT=${USER_PORT}
ExecStart=${NODE_PATH} ${INSTALL_DIR}/server.js
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sanaei-bridge > /dev/null 2>&1
systemctl restart sanaei-bridge

# 9. Install CLI Management Tool: sanaei-bridge
cat > /usr/local/bin/sanaei-bridge << 'EOF'
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
    echo -e "${GREEN}    Modiriat Panel Sanaei & Pole Ertebatie Application (Bridge) ${PLAIN}"
    echo -e "${CYAN}================================================================${PLAIN}"
    echo -e " ${GREEN}1.${PLAIN} Vaziate Service (Status)"
    echo -e " ${GREEN}2.${PLAIN} Rah-andazi Mojaddad (Restart)"
    echo -e " ${GREEN}3.${PLAIN} Tavaghofe Service (Stop)"
    echo -e " ${GREEN}4.${PLAIN} Shorou-e Service (Start)"
    echo -e " ${GREEN}5.${PLAIN} Moshahedeye Log-haye Zende (Logs)"
    echo -e " ${GREEN}6.${PLAIN} Beroozresani be Akharin Noskhe GitHub (Update)"
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
            echo -e "${CYAN}Dar hale daryafte update az GitHub...${PLAIN}"
            cd "$INSTALL_DIR" || exit
            git pull
            npm install --legacy-peer-deps
            npm run build
            systemctl restart sanaei-bridge
            echo -e "${GREEN}Beroozresani ba movafaghiat anjam shod!${PLAIN}"
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
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
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
EOF

chmod +x /usr/local/bin/sanaei-bridge

# 10. Get Server Public IP
SERVER_IP=$(curl -s4 icanhazip.com || curl -s4 ifconfig.me || curl -s4 api.ipify.org || echo "IP_SERVER")

echo ""
echo -e "${GREEN}================================================================${PLAIN}"
echo -e "${GREEN}              NASB BA MOVAFAGHIAT ANJAM SHOD!                   ${PLAIN}"
echo -e "${GREEN}================================================================${PLAIN}"
echo -e "Web Panel URL:      ${CYAN}http://${SERVER_IP}:${USER_PORT}${PLAIN}"
echo -e "Mobile Bridge API:  ${CYAN}http://${SERVER_IP}:${USER_PORT}/api/bridge${PLAIN}"
echo ""
echo -e "Dastoore Modiriat:  ${YELLOW}sanaei-bridge${PLAIN}"
echo -e "Vaziate Service:    ${YELLOW}systemctl status sanaei-bridge${PLAIN}"
echo -e "Log-haye Zende:     ${YELLOW}journalctl -u sanaei-bridge -f${PLAIN}"
echo -e "${GREEN}================================================================${PLAIN}"
echo ""
