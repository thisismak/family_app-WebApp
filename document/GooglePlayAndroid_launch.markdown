感謝您確認 PWA 已成功運作！您的 Web 應用程式（`https://www.mysandshome.com`）已經具備 PWA 功能（`manifest.json` 和 `serviceworker.js` 可正常訪問，Nginx 配置也已優化），接下來需要將其打包為 **Trusted Web Activity (TWA)**，並上架至 Google Play Store。以下是詳細的步驟，專為您的環境（Rocky Linux 9、Nginx、Node.js 18、Ionic 框架、`/var/www/family-app/public`）設計，使用命令列工具（不依賴 VS Code），並確保與您現有的配置無縫銜接。這些步驟將引導您完成打包、上傳和發佈流程。

---

### 將 PWA 上架 Google Play Store 的步驟

#### 步驟 1：準備環境
要將 PWA 打包為 TWA，您需要以下工具：
- **Node.js**：已確認您的伺服器使用 Node.js 18，無需額外安裝。
- **Java JDK 8**：TWA 打包需要 Java 8（更高版本可能不兼容）。
- **Android 命令列工具**：用於生成 Android App Bundle (AAB)。
- **Bubblewrap CLI**：Google 提供的工具，用於將 PWA 打包為 TWA。

1. **安裝 Java JDK 8**：
   - 在 Rocky Linux 9 上安裝 AdoptOpenJDK 8：
     ```bash
     sudo dnf install -y java-1.8.0-openjdk
     ```
   - 驗證安裝：
     ```bash
     java -version
     ```
     應顯示類似 `openjdk version "1.8.0_xxx"`。

2. **安裝 Android 命令列工具**：
   - 下載 Android 命令列工具：
     ```bash
     wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
     unzip commandlinetools-linux-9477386_latest.zip -d ~/android-sdk
     ```
   - 設置環境變數：
     ```bash
     export ANDROID_HOME=~/android-sdk
     export PATH=$PATH:$ANDROID_HOME/cmdline-tools/bin
     ```
   - 安裝必要的 SDK 工具：
     ```bash
     sdkmanager --install "build-tools;33.0.0" "platforms;android-33"
     ```

3. **安裝 Bubblewrap CLI**：
   - 安裝 Bubblewrap：
     ```bash
     sudo npm install -g @bubblewrap/cli
     ```
   - 驗證安裝：
     ```bash
     bubblewrap --version
     ```

---

#### 步驟 2：初始化 TWA 專案
Bubblewrap 會根據您的 `manifest.json` 生成 TWA 專案，並自動配置 `assetlinks.json` 用於數位資產連結驗證。

1. **創建工作目錄**：
   ```bash
   mkdir ~/twa-family-app
   cd ~/twa-family-app
   ```

2. **初始化 Bubblewrap 專案**：
   ```bash
   bubblewrap init --manifest=https://www.mysandshome.com/manifest.json
   ```
   - Bubblewrap 會下載 `manifest.json` 並啟動互動式精靈，提示您輸入以下資訊：
     - **應用程式名稱**：輸入 `Family App`（或根據您的 `manifest.json` 的 `name`）。
     - **包名**：使用反向域名格式，例如 `com.mysandshome.app`（必須唯一）。
     - **版本號**：預設為 `1.0.0`。
     - **版本代碼**：預設為 `1`。
     - **簽名金鑰**：選擇生成新金鑰（記錄密碼，後續更新需要）。
     - **圖標**：使用 `manifest.json` 中的 `/assets/icon-512x512.png`。
   - 完成後，Bubblewrap 會生成以下檔案：
     - `twa-manifest.json`：TWA 專案配置。
     - Android 專案檔案（`app/` 目錄）。
     - `assetlinks.json`：用於驗證 PWA 和應用程式的關聯。

3. **檢查生成的 `assetlinks.json`**：
   - 查看檔案：
     ```bash
     cat assetlinks.json
     ```
   - 應包含類似以下內容（`package_name` 和 `sha256_cert_fingerprints` 會不同）：
     ```json
     [{
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.mysandshome.app",
         "sha256_cert_fingerprints": ["XX:XX:XX:..."]
       }
     }]
     ```

4. **部署 `assetlinks.json`**：
   - 將 `assetlinks.json` 複製到 `/var/www/family-app/public/.well-known/`：
     ```bash
     sudo mkdir -p /var/www/family-app/public/.well-known
     sudo cp assetlinks.json /var/www/family-app/public/.well-known/
     sudo chown nginx:nginx /var/www/family-app/public/.well-known/assetlinks.json
     sudo chmod 644 /var/www/family-app/public/.well-known/assetlinks.json
     ```
   - 驗證檔案可公開訪問：
     ```bash
     curl -I https://www.mysandshome.com/.well-known/assetlinks.json
     ```
     應返回 `HTTP/1.1 200 OK` 和 `Content-Type: application/json`。

5. **確認 Nginx 配置**：
   - 您的 `/etc/nginx/conf.d/family-app.conf` 已包含 `location /.well-known/`，確保無快取（`expires off`）。若需檢查：
     ```bash
     cat /etc/nginx/conf.d/family-app.conf | grep -A 3 "location /.well-known/"
     ```
     應顯示：
     ```
     location /.well-known/ {
         root /var/www/family-app/public;
         expires off;
         access_log off;
     }
     ```
   - 若無此配置，需更新檔案（參考前述問題中的 `family-app.conf`）並重啟 Nginx：
     ```bash
     sudo nginx -t
     sudo systemctl restart nginx
     ```

---

#### 步驟 3：生成 Android App Bundle (AAB)
1. **構建 TWA**：
   - 在 TWA 專案目錄（`~/twa-family-app`）中運行：
     ```bash
     bubblewrap build
     ```
   - Bubblewrap 會自動下載依賴項（若首次運行），並生成簽名的 AAB 檔案（`app-release-bundle.aab`）。

2. **檢查生成的 AAB**：
   - 確認 AAB 檔案：
     ```bash
     ls -l app/build/outputs/bundle/release/
     ```
     應看到 `app-release-bundle.aab`。

3. **（可選）測試 AAB**：
   - 使用 Android 模擬器或實體設備測試：
     ```bash
     bubblewrap doctor
     ```
     確保環境無誤，然後使用 Android Studio 或 `adb` 安裝 AAB（需要額外配置 Android 模擬器）。
   - 驗證 TWA 是否全螢幕顯示您的 PWA（無瀏覽器地址欄），並檢查 `https://www.mysandshome.com/.well-known/assetlinks.json` 是否正確驗證。

---

#### 步驟 4：設置 Google Play Console
1. **創建 Google Play 開發者帳戶**：
   - 訪問 [Google Play Console](https://play.google.com/console) 並註冊（一次性費用 25 美元）。
   - 完成帳戶設置（包括付款和開發者資訊）。

2. **創建新應用程式**：
   - 在 Google Play Console 中，點擊「創建應用程式」。
   - 輸入：
     - **應用程式名稱**：`Family App`。
     - **預設語言**：選擇您的目標語言（例如 `zh-TW`）。
     - **應用程式類型**：選擇「免費」。
     - **類別**：選擇適合的類別（例如「生活方式」或「工具」）。
   - 同意 Google Play 政策並保存。

3. **設置應用程式清單**：
   - 填寫應用程式詳情：
     - **簡短描述**：例如「家庭管理應用程式，提供日曆、任務和聊天功能」。
     - **完整描述**：詳細介紹您的 PWA 功能（例如 Ionic 介面、離線支援）。
     - **圖標**：上傳 512x512 像素的圖標（可從 `/var/www/family-app/public/assets/icon-512x512.png` 複製）。
     - **螢幕截圖**：提供手機和平板的螢幕截圖（至少 2 張，建議 1080x1920 像素）。
     - **功能圖形**：上傳 1024x500 像素的宣傳圖。
     - **隱私政策**：提供隱私政策 URL（例如 `https://www.mysandshome.com/privacy`）。
   - 設置年齡分級（建議選擇 13+，符合 Google Play 家庭計畫要求）。

---

#### 步驟 5：上傳並發佈 AAB
1. **創建內部測試版本**：
   - 在 Google Play Console 的「測試」>「內部測試」中，點擊「創建新版本」。
   - 上傳 `app-release-bundle.aab`（位於 `~/twa-family-app/app/build/outputs/bundle/release/`）。
   - 填寫版本說明（例如「初始 TWA 版本，基於 PWA」）。
   - 添加測試者（輸入 Gmail 地址，允許內部測試）。

2. **提交審核**：
   - 完成「應用程式內容」和「商店清單」的所有必填項目（應顯示綠色勾號）。
   - 在「發佈概覽」中，點擊「提交審核」。
   - 審核通常需要數小時至數天。

3. **發佈到公開**：
   - 內部測試通過後，在「發佈」>「正式版本」中創建新版本，提交相同的 AAB。
   - 審核通過後，您的應用程式將在 Google Play Store 上線。

---

#### 步驟 6：驗證發佈
1. **檢查應用程式**：
   - 在 Android 設備上下載您的應用程式（搜尋「Family App」或使用 Play Store 連結）。
   - 確認應用程式全螢幕運行（無瀏覽器 UI），並顯示您的 PWA 內容（`index.html` 的 Ionic 介面）。
   - 測試離線模式（斷開網路，確認快取內容是否顯示）。

2. **檢查日誌**：
   - 若應用程式無法正常運行，檢查 Nginx 日誌：
     ```bash
     sudo cat /var/log/nginx/family-app-error.log
     ```
   - 檢查 `assetlinks.json` 是否正確：
     ```bash
     curl https://www.mysandshome.com/.well-known/assetlinks.json
     ```

---

#### 步驟 7：維護與更新
1. **更新 PWA**：
   - 您的 PWA 內容（`/var/www/family-app/public`）可直接更新，無需重新提交 AAB，因為 TWA 從 `https://www.mysandshome.com` 載入內容。
   - 若更新 `serviceworker.js` 的快取（例如更改 `CACHE_NAME` 為 `family-app-cache-v2`），需確保用戶清除舊快取：
     ```bash
     sudo vi /var/www/family-app/public/serviceworker.js
     ```
     更新 `CACHE_NAME` 並重啟 Nginx：
     ```bash
     sudo systemctl restart nginx
     ```

2. **更新 TWA**：
   - 若需更新應用程式版本（例如更改包名或圖標），修改 `twa-manifest.json` 並重新運行：
     ```bash
     cd ~/twa-family-app
     bubblewrap update
     bubblewrap build
     ```
   - 上傳新的 AAB 到 Google Play Console。

3. **版本控制**：
   - 將 TWA 專案提交到 GitHub：
     ```bash
     cd ~/twa-family-app
     git init
     git add .
     git commit -m "Initial TWA project for Family App"
     git remote add origin <您的 GitHub 儲存庫 URL>
     git push origin main
     ```

---

### 注意事項
1. **Lighthouse 分數**：
   - Google Play Store 可能要求 PWA 的 Lighthouse 分數達到 80 分以上（特別是效能分數）。檢查方式：
     ```bash
     npm install -g lighthouse
     lighthouse https://www.mysandshome.com --output=html --output-path=lighthouse-report.html
     ```
   - 查看報告（`lighthouse-report.html`）並優化效能（例如壓縮圖片、減少外部資源）。

2. **外部資源**：
   - 您的 `index.html` 使用 Ionic CDN（`https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1`）。建議下載到本地並快取（參考前述問題）：
     ```bash
     mkdir -p /var/www/family-app/public/lib
     curl -o /var/www/family-app/public/lib/ionic.esm.js https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.esm.js
     curl -o /var/www/family-app/public/lib/ionic.js https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.js
     curl -o /var/www/family-app/public/lib/ionic.bundle.min.css https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/css/ionic.bundle.min.css
     sudo chown -R nginx:nginx /var/www/family-app/public/lib
     sudo chmod -R 755 /var/www/family-app/public/lib
     ```
   - 更新 `index.html` 和 `serviceworker.js` 的 `urlsToCache`。

3. **Google Play 政策**：
   - 確保您的 PWA 遵守 Google Play 政策（例如無違規內容、提供隱私政策）。
   - 年齡分級選擇 13+，以符合家庭計畫要求。

4. **數位資產連結**：
   - 若 `assetlinks.json` 驗證失敗（應用程式顯示瀏覽器 UI），檢查 `sha256_cert_fingerprints` 是否與簽名金鑰匹配：
     ```bash
     keytool -list -v -keystore ~/twa-family-app/app/release.keystore
     ```
     更新 `/var/www/family-app/public/.well-known/assetlinks.json` 並重新部署。

---

### 結論
透過 Bubblewrap 將您的 PWA 打包為 TWA，並上架 Google Play Store 的過程包括：安裝工具、初始化 TWA 專案、部署 `assetlinks.json`、生成 AAB、設置 Google Play Console、提交審核。您的現有 PWA（`manifest.json` 和 `serviceworker.js`）已準備好，只需確保 `assetlinks.json` 正確部署並通過 Lighthouse 檢查。

**後續行動**：
- 若需檢查 `assetlinks.json` 內容，請分享：
  ```bash
  cat /var/www/family-app/public/.well-known/assetlinks.json
  ```
- 若遇到 Bubblewrap 或 Google Play Console 的具體錯誤，請提供錯誤訊息，我會幫您排查。
- 是否需要推送通知（例如透過 Firebase）以增強 PWA 功能？

請提供進一步細節或問題，我會繼續協助您順利上架！[](https://developers.google.com/codelabs/pwa-in-play)[](https://www.mobiloud.com/blog/publishing-pwa-app-store)