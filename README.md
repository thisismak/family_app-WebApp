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
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_secure_password';
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
mkdir ~/family-app
cd ~/family-app
git clone https://github.com/thisismak/family_app-WebApp .
## 進入網站目錄及透過package.json安裝需要的工具
cd ~/family-app
npm install
## 建立環境及加入SQL內容(因安全性問題, 不建議上載到Github)
vi .env
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=your_secure_password
DB_NAME=family_app
PORT=8100
JWT_SECRET=your_jwt_secret  # 使用你提供的 JWT_SECRET 或生成新值
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
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;  # 替換為你的域名或服務器 IP

    location / {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(html|css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/username/family-app/public;
        expires 30d;
        access_log off;
    }
}
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
## 打開網站
例如 http://10.0.0.70/
