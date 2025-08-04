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

  // Menu navigation
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

  // Sign out
  document.getElementById("signOut")?.addEventListener("click", () => {
    console.log("點擊登出");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    console.log("已登出，清除 token");
    window.location.href = "/login.html";
  });

  // Toast display helper function
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
        throw new Error(data.error || "Failed to check family status");
      }
      const hasFamily = data.success && Array.isArray(data.data.families) && data.data.families.length > 0;
      console.log("hasFamily 結果:", hasFamily);
      return hasFamily;
    } catch (error) {
      console.error("檢查家庭狀態錯誤:", error);
      await showToast(`Failed to check family status: ${error.message}`, 2000, "danger");
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

  const chatList = document.getElementById("chat_list");
  const messageForm = document.getElementById("message_form");
  const submitMessageButton = document.getElementById("submit_message");

  // Check family status
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

  // Initialize Socket.IO
  const socket = io("http://localhost:8100", {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Socket.IO 已連接到服務器");
    socket.emit("join", { token });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO 連接錯誤:", error);
    showToast("Unable to connect to chat server", 2000, "danger");
  });

  socket.on("load_messages", async (messages) => {
    const user = await fetchUser();
    chatList.innerHTML = "";
    if (messages.length === 0) {
      chatList.innerHTML = `<ion-item><ion-label>No messages found</ion-label></ion-item>`;
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
      socket.emit("message", message);
      form.reset();
      await showToast("Message sent", 2000, "success");
    } catch (error) {
      console.error("發送訊息錯誤:", error);
      await showToast(`Failed to send message: ${error.message}`, 2000, "danger");
    }
  });
});