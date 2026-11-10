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
echo -e "${GREEN}          نصب خودکار پنل مدیریت ثنایی و پل ارتباطی اپلیکیشن     ${PLAIN}"
echo -e "${CYAN}================================================================${PLAIN}"
echo ""

# 1. Check Root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[ERROR] این اسکریپت باید با دسترسی دسترسی روت (root) اجرا شود!${PLAIN}"
    echo -e "لطفاً با دستور ${YELLOW}sudo -i${PLAIN} به کاربر روت رفته و مجدداً اسکریپت را اجرا نمایید."
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

echo -e "${BLUE}[1/6] سیستم‌عامل شناسایی شد: ${GREEN}${OS_TYPE}${PLAIN}"

# 3. Update repositories and install base packages
echo -e "${BLUE}[2/6] در حال نصب بسته‌های پایه (git, curl, wget, tar, build-essential)...${PLAIN}"
if [[ "$PKG_MGR" == "apt-get" ]]; then
    apt-get update -y > /dev/null 2>&1
    apt-get install -y curl wget git tar socat systemd net-tools build-essential > /dev/null 2>&1
elif [[ "$PKG_MGR" == "yum" || "$PKG_MGR" == "dnf" ]]; then
    $PKG_MGR update -y > /dev/null 2>&1
    $PKG_MGR install -y curl wget git tar socat systemd net-tools gcc gcc-c++ make > /dev/null 2>&1
fi

# 4. Check & Install Node.js 20+ LTS
echo -e "${BLUE}[3/6] بررسی نسخه Node.js...${PLAIN}"
NEED_NODE_INSTALL=true

if command -v node > /dev/null 2>&1; then
    NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "$NODE_VER" -ge 20 ]; then
        echo -e "${GREEN}Node.js نسخه $(node -v) قبلاً نصب شده و معتبر است.${PLAIN}"
        NEED_NODE_INSTALL=false
    else
        echo -e "${YELLOW}نسخه فعلی Node.js ($(node -v)) قدیمی است. ارتقا به Node.js 20 LTS...${PLAIN}"
    fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
    echo -e "${YELLOW}در حال نصب Node.js 20.x LTS...${PLAIN}"
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
echo -e "${BLUE}[4/6] دریافت آخرین فایل‌های پنل...${PLAIN}"

# Check if current directory already has package.json and server.ts
if [ -f "./server.ts" ] && [ -f "./package.json" ]; then
    echo -e "${YELLOW}اسکریپت درون پوشه سورس اجرا شده است. کپی فایل‌ها به ${INSTALL_DIR}...${PLAIN}"
    mkdir -p "$INSTALL_DIR"
    cp -ru ./* "$INSTALL_DIR/" 2>/dev/null || true
else
    mkdir -p "$INSTALL_DIR"
    DOWNLOAD_SUCCESS=false

    # Try Git Clone from GitHub first
    echo -e "در حال بررسی و دریافت از گیت‌هاب (${REPO_URL})..."
    if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
        if [ -f "$INSTALL_DIR/package.json" ]; then
            DOWNLOAD_SUCCESS=true
            echo -e "${GREEN}فایل‌های سورس با موفقیت از گیت‌هاب دریافت شد.${PLAIN}"
        fi
    fi

    # Fallback to direct bundle download from AI Studio
    if [ "$DOWNLOAD_SUCCESS" = false ]; then
        echo -e "${YELLOW}کلون از گیت‌هاب انجام نشد (احتمالاً ریپازیتوری هنوز در گیت‌هاب ساخته نشده یا خالی است).${PLAIN}"
        echo -e "${CYAN}در حال دریافت مستقیم بسته کامل پروژه از سرور فعال...${PLAIN}"
        mkdir -p "$INSTALL_DIR"
        if curl -fsSL "https://ais-pre-ntugzaszszyeqscuwuvvxb-481941350957.europe-west1.run.app/source.tar.gz" -o /tmp/sanaei-bundle.tar.gz 2>/dev/null; then
            tar -xzf /tmp/sanaei-bundle.tar.gz -C "$INSTALL_DIR"
            if [ -f "$INSTALL_DIR/package.json" ]; then
                DOWNLOAD_SUCCESS=true
                echo -e "${GREEN}پکیج کامل برنامه با موفقیت دریافت و در سرور مستقر شد!${PLAIN}"
                # Initialize git repo in the installed directory
                cd "$INSTALL_DIR"
                git init > /dev/null 2>&1 || true
                git remote add origin "$REPO_URL" > /dev/null 2>&1 || true
            fi
        fi
    fi

    # If still not downloaded, prompt user
    if [ "$DOWNLOAD_SUCCESS" = false ]; then
        echo -e "${YELLOW}دریافت خودکار انجام نشد. لطفاً آدرس دلخواه گیت‌هاب یا فایل فشرده را وارد کنید:${PLAIN}"
        read -p "آدرس Git Repo یا لینک tar.gz: " USER_REPO
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
echo -e "${CYAN}تنظیم پورت اجرای پنل:${PLAIN}"
read -p "پورت مورد نظر برای اجرای پنل [پیش‌فرض 3000]: " USER_PORT
USER_PORT=${USER_PORT:-$DEFAULT_PORT}

# 7. Install NPM Dependencies & Build
echo -e "${BLUE}[5/6] نصب پکیج‌های npm و بیلد فایل‌های فرانت‌اند...${PLAIN}"
npm install --include=dev

echo -e "در حال بیلد Vite..."
npm run build

# 8. Create Systemd Service
echo -e "${BLUE}[6/6] ایجاد و فعال‌سازی سرویس systemd...${PLAIN}"

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
ExecStart=${NPM_PATH} start
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
    echo -e "${GREEN}      مدیریت پنل میانه ثنایی و پل ارتباطی اپلیکیشن (Bridge)      ${PLAIN}"
    echo -e "${CYAN}================================================================${PLAIN}"
    echo -e " ${GREEN}1.${PLAIN} وضعیت سرویس (Status)"
    echo -e " ${GREEN}2.${PLAIN} راه‌اندازی مجدد (Restart)"
    echo -e " ${GREEN}3.${PLAIN} توقف سرویس (Stop)"
    echo -e " ${GREEN}4.${PLAIN} شروع سرویس (Start)"
    echo -e " ${GREEN}5.${PLAIN} مشاهده لاگ‌های زنده (Logs)"
    echo -e " ${GREEN}6.${PLAIN} بروزرسانی به آخرین نسخه گیت‌هاب (Update)"
    echo -e " ${GREEN}7.${PLAIN} تنظیم دامنه اختصاصی با Nginx و SSL رایگان Certbot"
    echo -e " ${GREEN}8.${PLAIN} تغییر پورت برنامه (Change Port)"
    echo -e " ${RED}9.${PLAIN} حذف کامل برنامه (Uninstall)"
    echo -e " ${YELLOW}0.${PLAIN} خروج (Exit)"
    echo -e "${CYAN}================================================================${PLAIN}"
    read -p "لطفاً یک گزینه را انتخاب کنید [0-9]: " choice
    case $choice in
        1)
            systemctl status sanaei-bridge
            ;;
        2)
            systemctl restart sanaei-bridge
            echo -e "${GREEN}سرویس با موفقیت ری‌استارت شد.${PLAIN}"
            ;;
        3)
            systemctl stop sanaei-bridge
            echo -e "${YELLOW}سرویس متوقف شد.${PLAIN}"
            ;;
        4)
            systemctl start sanaei-bridge
            echo -e "${GREEN}سرویس شروع به کار کرد.${PLAIN}"
            ;;
        5)
            echo -e "${CYAN}برای خروج از لاگ کلیدهای Ctrl+C را فشار دهید...${PLAIN}"
            journalctl -u sanaei-bridge -f
            ;;
        6)
            echo -e "${CYAN}در حال دریافت آپدیت از گیت‌هاب...${PLAIN}"
            cd "$INSTALL_DIR" || exit
            git pull
            npm install --include=dev
            npm run build
            systemctl restart sanaei-bridge
            echo -e "${GREEN}بروزرسانی با موفقیت انجام شد!${PLAIN}"
            ;;
        7)
            read -p "دامنه یا ساب‌دامنه خود را وارد کنید (مثلاً api.example.com): " DOMAIN_NAME
            if [ -n "$DOMAIN_NAME" ]; then
                apt-get install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1 || yum install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
                cat > /etc/nginx/conf.d/${DOMAIN_NAME}.conf << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF
                nginx -t && systemctl restart nginx
                certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
                echo -e "${GREEN}دامنه با SSL روی آدرس https://${DOMAIN_NAME} ست شد!${PLAIN}"
            fi
            ;;
        8)
            read -p "پورت جدید را وارد کنید: " NEW_PORT
            if [ -n "$NEW_PORT" ]; then
                sed -i "s/Environment=PORT=.*/Environment=PORT=${NEW_PORT}/g" /etc/systemd/system/sanaei-bridge.service
                systemctl daemon-reload
                systemctl restart sanaei-bridge
                echo -e "${GREEN}پورت با موفقیت به ${NEW_PORT} تغییر یافت.${PLAIN}"
            fi
            ;;
        9)
            read -p "آیا مطمئن هستید که می‌خواهید پنل را به طور کامل حذف کنید؟ [y/N]: " confirm
            if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
                systemctl stop sanaei-bridge
                systemctl disable sanaei-bridge
                rm -f /etc/systemd/system/sanaei-bridge.service
                systemctl daemon-reload
                rm -rf "$INSTALL_DIR"
                rm -f /usr/local/bin/sanaei-bridge
                echo -e "${GREEN}پنل با موفقیت حذف شد.${PLAIN}"
                exit 0
            fi
            ;;
        0)
            exit 0
            ;;
        *)
            echo -e "${RED}گزینه نامعتبر است!${PLAIN}"
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
echo -e "${GREEN}              نصب با موفقیت کامل انجام شد!                      ${PLAIN}"
echo -e "${GREEN}================================================================${PLAIN}"
echo -e "آدرس وب پنل مدیریت:    ${CYAN}http://${SERVER_IP}:${USER_PORT}${PLAIN}"
echo -e "آدرس API اپلیکیشن:     ${CYAN}http://${SERVER_IP}:${USER_PORT}/api/bridge${PLAIN}"
echo ""
echo -e "دستور مدیریت پنل در سرور: ${YELLOW}sanaei-bridge${PLAIN}"
echo -e "بررسی وضعیت با systemd:   ${YELLOW}systemctl status sanaei-bridge${PLAIN}"
echo -e "مشاهده لاگ‌های زنده:      ${YELLOW}journalctl -u sanaei-bridge -f${PLAIN}"
echo -e "${GREEN}================================================================${PLAIN}"
echo ""
