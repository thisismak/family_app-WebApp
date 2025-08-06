# Server安裝 (Rocky Linux 9)
## 更新系統
sudo dnf update -y
## 安裝EPEL及
sudo dnf install -y epel-release
sudo dnf module install nodejs:18
↓↓↓ 備用方案, export為開放proxy加速, unset為取消
export http_proxy=http://123.45.67.89:8080
export https_proxy=http://123.45.67.89:8080
unset http_proxy
unset https_proxy
## 檢查版本
node -v
例如 v18.20.6
npm -v
例如 10.8.2
## 安焋Mariadb SQL
sudo dnf install -y mariadb-server
## 啟動Mariadb SQL
sudo systemctl start mariadb
sudo systemctl enable mariadb
## 初始化SQL設置
sudo mysql_secure_installation
## 建立nginx與SQL溝通的數據庫及登入帳號
mysql -u root -p
CREATE DATABASE family_app;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'sam1_sql_password';
GRANT ALL PRIVILEGES ON family_app.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
## 安裝nginx
sudo dnf install -y nginx
## 啟動nginx
sudo systemctl start nginx
sudo systemctl enable nginx
## 檢查nginx狀態
sudo systemctl status nginx
## 安裝Git來同步Github
sudo dnf install -y git
## 建立網站目錄後從Github下載網站內容
mkdir -p /var/www/family-app
cd /var/www/family-app
git clone https://github.com/thisismak/family_app-WebApp .
## 進入網站目錄及透過package.json安裝需要的工具
cd /var/www/family-app
npm install
## 建立環境及加入SQL內容(因安全性問題, 不建議上載到Github)
vi .env
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=sam1_sql_password
DB_NAME=family_app
PORT=8100
JWT_SECRET=bDiB6RXGKM96ODYWFfyXgl/9r1ar6/CgGLYfi17HKsBy94YduWwgmaIk/eIa31BF
## Project中安裝MySQL/MariaDB套件
npm install mysql2
## 解釋typescript內容
npx tsc
## 執行typescipt轉換好的Javascript server
node dist/server.js
## 測試不經nginx打開網站
curl http://localhost:8100
## 建立nginx的family網站配置文件
sudo vi /etc/nginx/conf.d/family-app.conf
```
# HTTP 重定向：將 mysandshome.com 和 www.mysandshome.com 重定向到 https://www.mysandshome.com
server {
    listen 80;
    server_name mysandshome.com www.mysandshome.com;
    return 301 https://www.mysandshome.com$request_uri;
}

# HTTPS 主服務器塊，僅處理 www.mysandshome.com
server {
    listen 443 ssl;
    server_name www.mysandshome.com;

    ssl_certificate /etc/letsencrypt/live/mysandshome.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mysandshome.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    ssl_ecdh_curve prime256v1:secp384r1:secp521r1;

    # 啟用訪問日誌
    access_log /var/log/nginx/family-app-access.log;
    # 啟用錯誤日誌
    error_log /var/log/nginx/family-app-error.log;

    # 阻止無效請求
    location ~* (wp-admin|wordpress|twint_ch\.js|lkk_ch\.js) {
        return 403;
    }

    # PWA manifest 文件，禁用快取
    location = /manifest.json {
        root /var/www/family-app/public;
        expires off;
        access_log off;
    }

    # PWA Service Worker 文件，禁用快取
    location = /serviceworker.js {
        root /var/www/family-app/public;
        expires off;
        access_log off;
    }

    # Digital Asset Links for TWA
    location /.well-known/ {
        root /var/www/family-app/public;
        expires off;
        access_log off;
    }

    # 靜態檔案
    location ~* \.(html|css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/family-app/public;
        expires 30d;
        access_log off;
    }

    # 反向代理到 Node.js 應用
    location / {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO 支援
    location /socket.io/ {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS 重定向：將 mysandshome.com 重定向到 www.mysandshome.com
server {
    listen 443 ssl;
    server_name mysandshome.com;

    ssl_certificate /etc/letsencrypt/live/mysandshome.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mysandshome.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    ssl_ecdh_curve prime256v1:secp384r1:secp521r1;

    return 301 https://www.mysandshome.com$request_uri;
}
```
## 檢查nginx的配置是否正常
sudo nginx -t
## 重啟nginx服務
sudo systemctl restart nginx
## 安裝node.js的管理套件
sudo npm install -g pm2
## 以守護進程模式在背景運行此應用，並監控它的運行狀態，自動重啟崩潰的應用。
pm2 start dist/server.js --name family-app
## 系統開機自動啟動。
pm2 startup
## PM2 能根據快照自動恢復所有應用狀態。
pm2 save
## 系統關閉防火墻
sudo dnf install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
## 關閉SElinux
sed -i 's/^SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config && setenforce 0
## 獲取Github Tokens(classic)
a. 打開Tokens page
https://github.com/settings/tokens
b. 點擊Generate new token
c. 改名及選擇repo及workflow
d. 點擊Genrate token
e. 生成僅顯示1次的登入密碼
## 檢查Github狀態
git status
## 將所有資料加入Github上載範圍
git add .
## 添加上載comment
git commit -m "installed server"
## 上載現系統文件到Github
git push origin main
## 安裝SSL (Let’s encrypt)
a. 安裝 Certbot 和 Nginx 插件
sudo dnf install certbot python3-certbot-nginx -y

b. 驗證 Certbot 安裝
certbot --version

c. 申請 Let's Encrypt SSL 證書
sudo certbot --nginx -d mysandshome.com -d www.mysandshome.com

d. Nginx 配置
早前步驟已設置完成
...
    ssl_certificate /etc/letsencrypt/live/mysandshome.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mysandshome.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
...

e. 檢查配置
sudo nginx -t

f. 如果沒有錯誤，重啟 Nginx 應用更改
sudo systemctl restart nginx

g. 設置自動續期
sudo certbot renew --dry-run

h. 可以手動添加 Cron 任務
sudo crontab -e
0 0,12 * * * certbot renew --quiet

## Gmail SMTP設置
a. 安裝EPEL
sudo dnf install -y epel-release
b. 安裝s-nail
sudo dnf install -y s-nail
c. 檢查版本
s-nail --version
d. 升級權限
sudo touch /etc/s-nail.rc
sudo chmod 644 /etc/s-nail.rc
sudo chown root:root /etc/s-nail.rc
e. 添加Gmail SMTP功能
sudo vi /etc/s-nail.rc
set sendcharsets=utf-8
set from=testing.email111011@gmail.com
set mta=smtp://testing.email111011%40gmail.com:lgzrupgilrymwjpu@smtp.gmail.com:587
set smtp-use-starttls
set tls-verify=ignore
set smtp-auth=login
set v15-compat
f. 可發電郵測試功能
echo "<p>這是一封測試郵件</p>" | s-nail -s "測試郵件" -r "testing.email111011@gmail.com" -M "text/html" thismywing@hotmail.com

## 打開網站
例如 https://www.mysandshome.com/
