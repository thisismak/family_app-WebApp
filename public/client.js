document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM 已載入 chat.html");
  console.log("Ionic 版本:", window.Ionic?.version || "未載入");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  if (!token) {
    console.log("未找到 token，正在跳轉到 /login.html");
    window.location.href = "/login.html";
    return;
  }
  console.log("找到 token:", token.substring(0, 20) + "...");

  // 選單導航
  const navItems = {
    "nav-dashboard": "/index.html",
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

  // 登出
  document.getElementById("signOut")?.addEventListener("click", () => {
    console.log("點擊登出");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    console.log("已登出，清除 token");
    window.location.href = "/login.html";
  });

  // Toast 顯示輔助函數
  async function showToast(message, duration, color) {
    if (window.Ionic) {
      const toast = document.createElement("ion-toast");
      toast.message = message;
      toast.duration = duration;
      toast.color = color;
      document.body.appendChild(toast);
      await toast.present();
    } else {
      alert(message);
    }
  }

  async function checkFamilyStatus() {
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
        throw new Error(data.error || "無法檢查家庭狀態");
      }
      const hasFamily = data.success && Array.isArray(data.data.families) && data.data.families.length > 0;
      console.log("hasFamily 結果:", hasFamily);
      return hasFamily;
    } catch (error) {
      console.error("檢查家庭狀態錯誤:", error);
      await showToast(`無法檢查家庭狀態: ${error.message}`, 2000, "danger");
      return false;
    }
  }

  async function fetchUser() {
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
        throw new Error(data.error || "無法獲取用戶資料");
      }
      return {
        username: data.data.username || "Guest",
        email: data.data.email || "無電子郵件",
        user_id: data.data.user_id,
      };
    } catch (err) {
      console.error("獲取用戶錯誤:", err);
      return { username: "Guest", email: "未登入", user_id: null };
    }
  }

  const chatList = document.getElementById("chat_list");
  const messageForm = document.getElementById("message_form");
  const submitMessageButton = document.getElementById("submit_message");

  // 檢查家庭狀態
  const hasFamily = await checkFamilyStatus();
  console.log("最終 hasFamily 值:", hasFamily);
  if (!hasFamily) {
    await showToast("您尚未加入任何家庭，請先創建或加入家庭", 3000, "warning");
    chatList.innerHTML = `<ion-item><ion-label>請先創建或加入家庭以使用聊天功能</ion-label></ion-item>`;
    submitMessageButton.disabled = true;
    return;
  } else {
    submitMessageButton.disabled = false;
    chatList.innerHTML = "";
  }

  // 初始化 Socket.IO
  const socket = io("http://localhost:8100", {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Socket.IO 已連接到服務器");
    socket.emit("join", { token });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO 連接錯誤:", error);
    showToast("無法連接到聊天服務器", 2000, "danger");
  });

  socket.on("load_messages", async (messages) => {
    const user = await fetchUser();
    chatList.innerHTML = "";
    if (messages.length === 0) {
      chatList.innerHTML = `<ion-item><ion-label>未找到訊息</ion-label></ion-item>`;
    } else {
      messages.forEach((message) => {
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
      });
    }
    chatList.scrollTop = chatList.scrollHeight;
  });

  socket.on("message", async (message) => {
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

  socket.on("user_joined", (msg) => {
    const div = document.createElement("div");
    div.className = "system-message";
    div.textContent = msg;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });

  socket.on("user_left", (msg) => {
    const div = document.createElement("div");
    div.className = "system-message";
    div.textContent = msg;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const content = formData.get("content")?.toString().trim();
    console.log("訊息表單提交:", { content });

    if (!content) {
      await showToast("訊息內容為必填", 2000, "danger");
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
      socket.emit("message", message);
      form.reset();
      await showToast("訊息已發送", 2000, "success");
    } catch (error) {
      console.error("發送訊息錯誤:", error);
      await showToast(`無法發送訊息: ${error.message}`, 2000, "danger");
    }
  });
});