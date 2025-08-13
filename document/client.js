document.addEventListener("DOMContentLoaded", async () => {  // DOM 載入事件：初始化聊天頁面邏輯
  console.log("DOM 已載入 chat.html");
  console.log("Ionic 版本:", window.Ionic?.version || "未載入");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";  // 獲取 token，用於 API 驗證
  if (!token) {  // 無 token 則跳轉登入頁
    console.log("未找到 token，正在跳轉到 /login.html");
    window.location.href = "/login.html";
    return;
  }
  console.log("找到 token:", token.substring(0, 20) + "...");

  // Menu navigation  // 選單導航綁定，與 HTML id 關聯
  const navItems = {
    "nav-calendar": "/calendar.html",
    "nav-tasks": "/tasks.html",
    "nav-chat": "/chat.html",
    "nav-family": "/family.html",
  };
  Object.keys(navItems).forEach((id) => {
    const item = document.getElementById(id);
    item?.addEventListener("click", () => {
      const url = navItems[id];
      console.log(`正在跳轉到 ${url}`);
      window.location.href = url;
    });
  });

  // Sign out  // 登出綁定，清除 token 並跳轉
  document.getElementById("signOut")?.addEventListener("click", () => {
    console.log("點擊登出");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    console.log("已登出，清除 token");
    window.location.href = "/login.html";
  });

  // Toast display helper function  // 全局提示函數，使用 Ionic toast 或 alert
  async function showToast(message, duration, color) {
    if (window.Ionic && document.createElement("ion-toast").present) {
      const toast = document.createElement("ion-toast");
      toast.message = message;
      toast.duration = duration;
      toast.color = color;
      document.body.appendChild(toast);
      await toast.present();
    } else {
      console.warn("Ionic not loaded, falling back to alert");
      alert(message);
    }
  }

  async function checkFamilyStatus() {  // 檢查用戶家庭狀態，透過 /my-families API
    try {
      console.log("檢查用戶家庭狀態");
      const response = await fetch("/my-families", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("檢查家庭狀態回應:", data);
      if (!response.ok) {
        console.error("家庭狀態請求失敗:", data.error);
        throw new Error(data.error || "Failed to check family status");
      }
      const hasFamily = data.success && Array.isArray(data.data.families) && data.data.families.length > 0;
      console.log("hasFamily 結果:", hasFamily, "Family IDs:", data.data.families.map(f => f.id));
      return hasFamily;
    } catch (error) {
      console.error("檢查家庭狀態錯誤:", error);
      await showToast(`Failed to check family status: ${error.message}`, 2000, "danger");
      return false;
    }
  }

  async function fetchUser() {  // 獲取用戶資訊，透過 /user API
    try {
      console.log("正在獲取用戶資訊");
      const response = await fetch("/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("獲取用戶回應:", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user data");
      }
      return {
        username: data.data.username || "Guest",
        email: data.data.email || "No email",
        user_id: data.data.user_id,
      };
    } catch (err) {
      console.error("獲取用戶錯誤:", err);
      return { username: "Guest", email: "Not logged in", user_id: null };
    }
  }

  const chatList = document.getElementById("chat_list");  // 聊天列表元素
  const messageForm = document.getElementById("message_form");  // 訊息表單元素
  const submitMessageButton = document.getElementById("submit_message");  // 發送按鈕

  // Check family status  // 檢查家庭狀態，未加入則禁用聊天
  const hasFamily = await checkFamilyStatus();
  console.log("最終 hasFamily 值:", hasFamily);
  if (!hasFamily) {
    await showToast("You have not joined any family. Please create or join a family first.", 3000, "warning");
    chatList.innerHTML = `<ion-item><ion-label>Please create or join a family to use the chat feature</ion-label></ion-item>`;
    submitMessageButton.disabled = true;
    return;
  } else {
    submitMessageButton.disabled = false;
    chatList.innerHTML = "";
  }

  // Initialize Socket.IO  // 初始化 Socket.IO 客戶端，auth 傳遞 token 驗證
  console.log("Attempting Socket.IO connection with token:", token.substring(0, 20) + "...");
  const socket = io("https://www.mysandshome.com", {
    auth: { token }
  });

  socket.on("connect", () => {  // 連接成功事件：發送 join 事件
    console.log("Socket.IO connected successfully");
    socket.emit("join", { token });
  });

  socket.on("connect_error", (error) => {  // 連接錯誤事件：顯示提示
    console.error("Socket.IO 連接錯誤:", error);
    showToast("Unable to connect to chat server", 2000, "danger");
  });

  socket.on("load_messages", async (messages) => {  // 載入歷史訊息事件：渲染訊息列表
    const user = await fetchUser();
    chatList.innerHTML = "";
    if (messages.length === 0) {
      chatList.innerHTML = `<ion-item><ion-label>No messages found</ion-label></ion-item>`;
    } else {
      messages.forEach((message) => {
        const div = document.createElement("div");
        div.className = `message ${message.sender_id === user.user_id ? "sent" : "received"}`;  // 根據發送者決定樣式
        div.innerHTML = `
          <ion-avatar slot="start">
            <img src="/assets/user-${message.sender_id}.png" alt="${message.sender_username}" onerror="this.src='/assets/user-default.png'" />  <!-- 頭像，關聯 onerror 後備圖片 -->
          </ion-avatar>
          <strong>${message.sender_username}</strong> (${new Date(message.sent_at).toLocaleString()}):
          <p>${message.content}</p>
        `;
        chatList.appendChild(div);
      });
    }
    chatList.scrollTop = chatList.scrollHeight;  // 滾動到底部
  });

  socket.on("message", async (message) => {  // 接收新訊息事件：追加訊息並滾動
    const user = await fetchUser();
    const div = document.createElement("div");
    div.className = `message ${message.sender_id === user.user_id ? "sent" : "received"}`;
    div.innerHTML = `
      <ion-avatar slot="start">
        <img src="/assets/user-${message.sender_id}.png" alt="${message.sender_username}" onerror="this.src='/assets/user-default.png'" />
      </ion-avatar>
      <strong>${message.sender_username}</strong> (${new Date(message.sent_at).toLocaleString()}):
      <p>${message.content}</p>
    `;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });

  socket.on("user_joined", (msg) => {  // 用戶加入事件：顯示系統訊息
    const div = document.createElement("div");
    div.className = "system-message";
    div.textContent = msg;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });

  socket.on("user_left", (msg) => {  // 用戶離開事件：顯示系統訊息
    const div = document.createElement("div");
    div.className = "system-message";
    div.textContent = msg;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });

  messageForm?.addEventListener("submit", async (event) => {  // 表單提交事件：發送訊息透過 Socket.IO
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const content = formData.get("content")?.toString().trim();
    console.log("訊息表單提交:", { content });

    if (!content) {
      await showToast("Message content is required", 2000, "danger");
      return;
    }

    try {
      const user = await fetchUser();
      const message = {
        content,
        sender_id: user.user_id,
        sender_username: user.username,
        sent_at: new Date().toISOString(),
      };
      socket.emit("message", message);  // 發送訊息事件
      form.reset();
      await showToast("Message sent", 2000, "success");
    } catch (error) {
      console.error("發送訊息錯誤:", error);
      await showToast(`Failed to send message: ${error.message}`, 2000, "danger");
    }
  });
});