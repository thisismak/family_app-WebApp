# Selected Files Content

## public/calendar.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Calendar</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <!-- Ant Design CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.6.4/antd.min.css" />
    <!-- React, ReactDOM, Babel, Day.js, and Ant Design JS -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.13/dayjs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/antd/5.6.4/antd.min.js"></script>
    <style>
      ion-avatar {
        width: 40px;
        height: 40px;
        margin-right: 8px;
      }
      /* Ensure Ant Design DatePicker aligns with Ionic styling */
      .ant-picker {
        width: 100%;
        font-family: 'Poppins', sans-serif;
      }
      .ant-picker-input > input {
        font-size: 16px;
      }
      /* Style for highlighted event dates */
      ion-datetime {
        --background: #fff;
        --ion-color-primary: #3880ff;
      }
      ion-datetime .calendar-day.has-event {
        background-color: #e6f3ff;
        border-radius: 50%;
        color: #3880ff;
        font-weight: bold;
      }
      @media (max-width: 600px) {
        .ant-picker-dropdown {
          max-height: 70vh !important;
          overflow-y: auto !important;
          top: 10vh !important;
          left: 0 !important;
          right: 0 !important;
          width: 100vw !important;
          min-width: unset !important;
          border-radius: 12px !important;
        }
        .ant-picker-panel {
          max-height: 60vh !important;
          overflow-y: auto !important;
        }
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-menu content-id="main-content" side="start">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item id="nav-calendar"><ion-icon name="calendar-outline"></ion-icon>Calendar</ion-item>
            <ion-item id="nav-tasks"><ion-icon name="checkbox-outline"></ion-icon>Tasks</ion-item>
            <ion-item id="nav-chat"><ion-icon name="chatbubble-outline"></ion-icon>Chat</ion-item>
            <ion-item id="nav-family"><ion-icon name="people-outline"></ion-icon>Family</ion-item>
            <ion-item id="signOut"><ion-icon name="log-out-outline"></ion-icon>Sign Out</ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>S&S Family App - Calendar</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
          <div class="welcome-message">
            <h2>Your Family Calendar</h2>
            <p>View and manage family events.</p>
          </div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Calendar View</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-datetime></ion-datetime>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Event List</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list id="event-list">
                <ion-item>
                  <ion-label>Loading...</ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Create Event</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div id="create-event-root" class="ion-padding"></div>
            </ion-card-content>
          </ion-card>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small" class="ion-text-center">
              © 2025 S&S Family App. All rights reserved.
            </ion-title>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-app>

    <script type="text/babel">
      const { DatePicker, Button, Input, Modal, Form } = window.antd;
      const { useState } = React;

      const CreateEventForm = ({ onSubmit, showToast }) => {
        const [title, setTitle] = useState('');
        const [startDateTime, setStartDateTime] = useState(null);
        const [endDateTime, setEndDateTime] = useState(null);
        const [reminderDateTime, setReminderDateTime] = useState(null);

        const handleSubmit = async (e) => {
          e.preventDefault();
          const eventData = {
            title,
            start_datetime: startDateTime ? startDateTime.format('YYYY-MM-DD HH:mm:ss') : null,
            end_datetime: endDateTime ? endDateTime.format('YYYY-MM-DD HH:mm:ss') : null,
            reminder_datetime: reminderDateTime ? reminderDateTime.format('YYYY-MM-DD HH:mm:ss') : null,
          };
          await onSubmit(eventData);
          setTitle('');
          setStartDateTime(null);
          setEndDateTime(null);
          setReminderDateTime(null);
        };

        return (
          <form onSubmit={handleSubmit}>
            <ion-grid>
              <ion-row>
                <ion-col>
                  <ion-item>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </ion-item>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col>
                  <ion-item>
                    <DatePicker
                      showTime={{ format: 'HH' }}
                      format="YYYY-MM-DD HH"
                      value={startDateTime}
                      onChange={setStartDateTime}
                      placeholder="Select start time"
                      needConfirm
                      required
                    />
                  </ion-item>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col>
                  <ion-item>
                    <DatePicker
                      showTime={{ format: 'HH' }}
                      format="YYYY-MM-DD HH"
                      value={endDateTime}
                      onChange={setEndDateTime}
                      placeholder="Select end time"
                      needConfirm
                    />
                  </ion-item>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col>
                  <ion-item>
                    <DatePicker
                      showTime={{ format: 'HH' }}
                      format="YYYY-MM-DD HH"
                      value={reminderDateTime}
                      onChange={setReminderDateTime}
                      placeholder="Select reminder time"
                      needConfirm
                    />
                  </ion-item>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col>
                  <Button type="primary" htmlType="submit" block>
                    Create Event
                  </Button>
                </ion-col>
              </ion-row>
            </ion-grid>
          </form>
        );
      };

      const EditEventForm = ({ visible, onCancel, onSubmit, initialValues, showToast }) => {
        const [form] = Form.useForm();
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async (values) => {
          setSubmitting(true);
          const eventData = {
            title: values.title,
            start_datetime: values.start_datetime ? values.start_datetime.format('YYYY-MM-DD HH:mm:ss') : null,
            end_datetime: values.end_datetime ? values.end_datetime.format('YYYY-MM-DD HH:mm:ss') : null,
            reminder_datetime: values.reminder_datetime ? values.reminder_datetime.format('YYYY-MM-DD HH:mm:ss') : null,
          };
          await onSubmit(eventData);
          setSubmitting(false);
        };

        return (
          <Modal
            title="Edit Event"
            visible={visible}
            onCancel={onCancel}
            footer={null}
          >
            <Form
              form={form}
              initialValues={{
                title: initialValues.title,
                start_datetime: initialValues.start_datetime ? window.dayjs(initialValues.start_datetime) : null,
                end_datetime: initialValues.end_datetime ? window.dayjs(initialValues.end_datetime) : null,
                reminder_datetime: initialValues.reminder_datetime ? window.dayjs(initialValues.reminder_datetime) : null,
              }}
              onFinish={handleSubmit}
            >
              <Form.Item
                name="title"
                rules={[{ required: true, message: 'Please enter event title' }]}
              >
                <Input placeholder="Enter event title" />
              </Form.Item>
              <Form.Item
                name="start_datetime"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH' }}
                  format="YYYY-MM-DD HH"
                  placeholder="Select start time"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="end_datetime">
                <DatePicker
                  showTime={{ format: 'HH' }}
                  format="YYYY-MM-DD HH"
                  placeholder="Select end time"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="reminder_datetime">
                <DatePicker
                  showTime={{ format: 'HH' }}
                  format="YYYY-MM-DD HH"
                  placeholder="Select reminder time"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>
                  Update Event
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        );
      };

      const App = () => {
        const [editModalVisible, setEditModalVisible] = useState(false);
        const [editingEvent, setEditingEvent] = useState(null);

        React.useEffect(() => {
          window.addEventListener("openEditModal", (e) => {
            setEditingEvent(e.detail);
            setEditModalVisible(true);
          });
          return () => {
            window.removeEventListener("openEditModal", () => {});
          };
        }, []);

        const handleCreate = async (eventData) => {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
          try {
            const response = await fetch("/calendar", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(eventData),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Failed to create event");
            }
            await window.showToast(`Event created (ID: ${data.data.event_id})`, 2000, "success");
            await window.fetchEvents();
          } catch (error) {
            await window.showToast(`Failed to create event: ${error.message}`, 2000, "danger");
          }
        };

        const handleEdit = async (eventData) => {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
          try {
            const response = await fetch(`/calendar/${editingEvent.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(eventData),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Failed to update event");
            }
            await window.showToast("Event updated successfully", 2000, "success");
            setEditModalVisible(false);
            setEditingEvent(null);
            await window.fetchEvents();
          } catch (error) {
            await window.showToast(`Failed to update event: ${error.message}`, 2000, "danger");
          }
        };

        const handleDelete = async (eventId) => {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
          try {
            const response = await fetch(`/calendar/${eventId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Failed to delete event");
            }
            await window.showToast("Event deleted successfully", 2000, "success");
            await window.fetchEvents();
          } catch (error) {
            await window.showToast(`Failed to delete event: ${error.message}`, 2000, "danger");
          }
        };

        // 重新赋值，确保 window.handleEdit 是函数
        window.handleEdit = function(event) {
          // 通过 React 的 root 组件暴露一个方法
          // 这里直接触发 React 的 setState
          const root = document.getElementById("create-event-root");
          if (root && root._reactRootContainer) {
            // 触发 React 组件的 openEditModal
            // 你可以用 window.dispatchEvent 或自定义事件通知 React
            window.dispatchEvent(new CustomEvent("openEditModal", { detail: event }));
          }
        };
        window.handleDelete = handleDelete;

        const openEditModal = (event) => {
          setEditingEvent(event);
          setEditModalVisible(true);
        };

        return (
          <>
            <CreateEventForm onSubmit={handleCreate} showToast={window.showToast} />
            <EditEventForm
              visible={editModalVisible}
              onCancel={() => {
                setEditModalVisible(false);
                setEditingEvent(null);
              }}
              onSubmit={handleEdit}
              initialValues={editingEvent || {}}
              showToast={window.showToast}
            />
          </>
        );
      };

      ReactDOM.render(<App />, document.getElementById("create-event-root"));
    </script>

    <script>
      // Global events storage
      window.events = [];

      // Global showToast function
      window.showToast = async function (message, duration, color) {
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
      };

      // Global fetchEvents function
      window.fetchEvents = async function () {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
        try {
          console.log("Fetching event list");
          const response = await fetch("/calendar", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          console.log("Fetch events response:", data);
          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch events");
          }

          const eventList = document.getElementById("event-list");
          eventList.innerHTML = "";

          window.events = Array.isArray(data.data.events) ? data.data.events : [];
          console.log("Processing event data:", window.events);

          if (window.events.length === 0) {
            eventList.innerHTML = `<ion-item><ion-label>No events found</ion-label></ion-item>`;
          } else {
            for (const event of window.events) {
              const item = document.createElement("ion-item");
              item.innerHTML = `
                <ion-label>
                  <h2>${event.title}</h2>
                  <p>Start: ${new Date(event.start_datetime).toLocaleString()}</p>
                  ${event.end_datetime ? `<p>End: ${new Date(event.end_datetime).toLocaleString()}</p>` : ""}
                  ${event.reminder_datetime ? `<p>Reminder: ${new Date(event.reminder_datetime).toLocaleString()}</p>` : ""}
                  <div style="margin-top:12px;display:flex;gap:8px;flex-direction:row;">
                    <button class="edit-btn ion-activatable ion-color ion-color-primary" style="border:none;padding:8px 16px;border-radius:6px;background:#3880ff;color:#fff;display:flex;align-items:center;gap:4px;">
                      <ion-icon name="pencil-outline"></ion-icon> Edit
                    </button>
                    <button class="delete-btn ion-activatable ion-color ion-color-danger" style="border:none;padding:8px 16px;border-radius:6px;background:#eb445a;color:#fff;display:flex;align-items:center;gap:4px;">
                      <ion-icon name="trash-outline"></ion-icon> Delete
                    </button>
                  </div>
                </ion-label>
              `;
              item.querySelector(".edit-btn").addEventListener("click", () => {
                console.log("edit clicked", event);
                window.handleEdit(event);
              });
              item.querySelector(".delete-btn").addEventListener("click", () => window.handleDelete(event.id));
              eventList.appendChild(item);
            }
          }

          // Highlight event dates in calendar
          const calendar = document.querySelector("ion-datetime");
          if (calendar) {
            const eventDates = window.events.map(event => 
              new Date(event.start_datetime).toISOString().split('T')[0]
            );
            calendar.highlightedDates = eventDates.map(date => ({
              date,
              textColor: '#3880ff',
              backgroundColor: '#e6f3ff'
            }));
          }
        } catch (error) {
          console.error("Fetch events error:", error);
          await window.showToast(`Failed to load event list: ${error.message || "Server response error"}`, 3000, "danger");
        }
      };

      // Function to subscribe to push notifications
      async function subscribeToPush() {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission denied');
            await window.showToast('Please enable notifications to receive reminders', 3000, 'warning');
            return;
          }

          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BHQWOcRLHJmk2jhSeme_RxeBdhv9Rx4qPQ8ZMlSinSBUMOWQgP_pJnJBPnVZjFE05XOmmXg5mgaKQSQ_B6lj8e8'
          });

          const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
          const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription)
          });

          if (!response.ok) {
            throw new Error('Failed to save subscription');
          }

          console.log('Push subscription successful');
          await window.showToast('Successfully subscribed to reminders', 2000, 'success');
        } catch (error) {
          console.error('Push subscription error:', error);
          await window.showToast(`Failed to subscribe to reminders: ${error.message}`, 3000, 'danger');
        }
      }

      document.addEventListener("DOMContentLoaded", async () => {
        console.log("DOM loaded for calendar.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");
        const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
        if (!token) {
          console.log("No token found, redirecting to /login.html");
          window.location.href = "/login.html";
          return;
        }
        console.log("Token found:", token.substring(0, 20) + "...");

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
            console.log(`Navigating to ${url}`);
            window.location.href = url;
          });
        });

        // Sign out
        document.getElementById("signOut")?.addEventListener("click", () => {
          console.log("Sign out clicked");
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          console.log("Signed out, token cleared");
          window.location.href = "/login.html";
        });

        async function checkFamilyStatus() {
          try {
            console.log("Checking user family status");
            const response = await fetch("/my-families", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("Check family status response:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              throw new Error(data.error || "Failed to check family status");
            }
            return data.success && data.data && data.data.families && data.data.families.length > 0;
          } catch (error) {
            console.error("Check family status error:", error);
            await window.showToast(`Failed to check family status: ${error.message}`, 2000, "danger");
            return false;
          }
        }

        const hasFamily = await checkFamilyStatus();
        if (!hasFamily) {
          await window.showToast("You have not joined any family. Please create or join a family first.", 3000, "warning");
          window.location.href = "/family.html";
          return;
        }

        await window.fetchEvents();

        if ('serviceWorker' in navigator && 'PushManager' in window) {
          await subscribeToPush();
        } else {
          console.warn('Push notifications not supported in this browser');
          await window.showToast('Your browser does not support push notifications', 3000, 'warning');
        }
      });
    </script>
  </body>
</html>
```

## public/chat.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Chat</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      #chat_list { max-height: 400px; overflow-y: auto; padding: 16px; }
      .message { margin-bottom: 12px; padding: 12px; border-radius: 12px; box-shadow: var(--shadow); }
      .message.sent { background: var(--primary-pink); color: var(--text-dark); margin-left: 20%; }
      .message.received { background: var(--light-pink); margin-right: 20%; }
      .system-message { background: var(--ion-color-light); color: var(--ion-color-medium); text-align: center; font-style: italic; padding: 8px; margin-bottom: 12px; border-radius: 12px; }
      ion-avatar { width: 32px; height: 32px; margin-right: 8px; }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-menu content-id="main-content" side="start">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item id="nav-calendar"><ion-icon name="calendar-outline"></ion-icon>Calendar</ion-item>
            <ion-item id="nav-tasks"><ion-icon name="checkbox-outline"></ion-icon>Tasks</ion-item>
            <ion-item id="nav-chat"><ion-icon name="chatbubble-outline"></ion-icon>Chat</ion-item>
            <ion-item id="nav-family"><ion-icon name="people-outline"></ion-icon>Family</ion-item>
            <ion-item id="signOut"><ion-icon name="log-out-outline"></ion-icon>Sign Out</ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>S&S Family App - Chat</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
          <div class="welcome-message">
            <h2>Family Chat</h2>
            <p>Stay connected with your family.</p>
          </div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Send Message</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <form id="message_form" class="ion-padding">
                <ion-grid>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-textarea
                          name="content"
                          id="content"
                          placeholder="Enter your message"
                          required
                          label="Message"
                          label-placement="stacked"
                        ></ion-textarea>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-button expand="block" type="submit" id="submit_message">Send</ion-button>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </form>
            </ion-card-content>
          </ion-card>
          <ion-list id="chat_list"></ion-list>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small" class="ion-text-center">
              © 2025 S&S Family App. All rights reserved.
            </ion-title>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-app>

    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/dist/socket.io.min.js"></script>
    <script src="/client.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        console.log("Ionic loaded:", !!window.Ionic, window.Ionic?.version || "Not loaded");
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
      });
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/serviceworker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

## public/client.js

```js
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
      console.log("hasFamily 結果:", hasFamily, "Family IDs:", data.data.families.map(f => f.id));
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
  console.log("Attempting Socket.IO connection with token:", token.substring(0, 20) + "...");
  const socket = io("https://www.mysandshome.com", {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Socket.IO connected successfully");
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
```

## public/family.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Family Management</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      ion-avatar {
        width: 40px;
        height: 40px;
        margin-right: 8px;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-menu content-id="main-content" side="start">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item id="nav-calendar"><ion-icon name="calendar-outline"></ion-icon>Calendar</ion-item>
            <ion-item id="nav-tasks"><ion-icon name="checkbox-outline"></ion-icon>Tasks</ion-item>
            <ion-item id="nav-chat"><ion-icon name="chatbubble-outline"></ion-icon>Chat</ion-item>
            <ion-item id="nav-family"><ion-icon name="people-outline"></ion-icon>Family</ion-item>
            <ion-item id="signOut"><ion-icon name="log-out-outline"></ion-icon>Sign Out</ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>S&S Family App</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
          <div class="welcome-message">
            <h2>Manage Your Family</h2>
            <p>Build your family circle with love.</p>
          </div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>My Families</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list id="family-list">
                <ion-item>
                  <ion-label>Loading...</ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Create Family</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <form id="create_family_form" class="ion-padding">
                <ion-grid>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-input
                          type="text"
                          name="name"
                          id="family_name"
                          label="Family Name"
                          placeholder="Enter family name"
                          required
                        ></ion-input>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-button expand="block" type="submit">Create Family</ion-button>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </form>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Join Family</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <form id="join_family_form" class="ion-padding">
                <ion-grid>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-input
                          type="number"
                          name="family_id"
                          id="family_id"
                          label="Family ID"
                          placeholder="Enter family ID"
                          required
                        ></ion-input>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-button expand="block" type="submit">Join Family</ion-button>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </form>
            </ion-card-content>
          </ion-card>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small" class="ion-text-center">
              © 2025 S&S Family App. All rights reserved.
            </ion-title>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", async () => {
        console.log("DOM 已載入 family.html");
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

        // Fetch current user information
        let currentUsername = "Unknown User";
        async function fetchUser() {
          try {
            console.log("正在獲取當前用戶信息");
            const response = await fetch("/user", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("獲取用戶回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              throw new Error(data.error || "Failed to fetch user information");
            }
            currentUsername = data.data.username || "Unknown User";
          } catch (error) {
            console.error("獲取用戶錯誤:", error);
            await showToast(`Failed to load user information: ${error.message || 'Server response error'}`, 3000, "danger");
          }
        }

        async function fetchFamilies() {
          try {
            console.log("正在獲取家庭列表");
            const response = await fetch("/my-families", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("獲取家庭回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              throw new Error(data.error || "Failed to fetch families");
            }

            const familyList = document.getElementById("family-list");
            familyList.innerHTML = ""; // Clear the list

            const families = data.success && data.data && Array.isArray(data.data.families) ? data.data.families : [];
            console.log("處理家庭數據:", families);

            if (families.length === 0) {
              familyList.innerHTML = `<ion-item><ion-label>No families found</ion-label></ion-item>`;
            } else {
              for (const family of families) {
                let members = [];
                try {
                  console.log(`正在獲取家庭 ID ${family.id} 的成員`);
                  const memberResponse = await fetch(`/family/members?family_id=${family.id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  const memberData = await memberResponse.json();
                  console.log(`家庭 ${family.id} 的成員回應:`, memberData);
                  if (!memberResponse.ok) {
                    throw new Error(memberData.error || "Failed to fetch members");
                  }
                  members = Array.isArray(memberData.data.members) ? memberData.data.members : [];
                } catch (error) {
                  console.error(`獲取家庭 ${family.id} 的成員錯誤:`, error);
                  members = [];
                }

                const item = document.createElement("ion-item");
                item.innerHTML = `
                  <ion-label>
                    <h2>${family.name}</h2>
                    <p>Current Member: ${currentUsername}</p>
                    <p>ID: ${family.id} | Role: ${family.role || 'Owner'}</p>
                    <p>Family Members: ${members.length > 0 ? members.map(m => m.username).join(', ') : 'No members found'}</p>
                  </ion-label>
                `;
                familyList.appendChild(item);
              }
            }
          } catch (error) {
            console.error("獲取家庭錯誤:", error);
            await showToast(`Failed to load family list: ${error.message || 'Server response error'}`, 3000, "danger");
          }
        }

        // Fetch user information and load family list
        await fetchUser();
        await fetchFamilies();

        document.getElementById("create_family_form")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.target;
          const formData = new FormData(form);
          const name = formData.get("name");
          console.log("正在創建家庭:", { name });

          try {
            const response = await fetch("/family", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ name }),
            });
            const data = await response.json();
            console.log("創建家庭回應:", data);
            if (!response.ok) {
              throw new Error(data.error || "Failed to create family");
            }
            await showToast(`Family created (ID: ${data.data.family_id})`, 2000, "success");
            form.reset();
            await fetchFamilies(); // Refresh list
          } catch (error) {
            console.error("創建家庭錯誤:", error);
            await showToast(
              error.message === "User is already in a family"
                ? "You are already in a family and cannot create a new one"
                : `Failed to create family: ${error.message}`,
              2000,
              "danger"
            );
            await fetchFamilies(); // Refresh list
          }
        });

        document.getElementById("join_family_form")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.target;
          const formData = new FormData(form);
          const family_id = formData.get("family_id");
          console.log("正在加入家庭 ID:", family_id);

          try {
            const response = await fetch("/family/join", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ family_id }),
            });
            const data = await response.json();
            console.log("加入家庭回應:", data);
            if (!response.ok) {
              throw new Error(data.error || "Failed to join family");
            }
            await showToast("Joined family successfully", 2000, "success");
            form.reset();
            await fetchFamilies(); // Refresh list
          } catch (error) {
            console.error("加入家庭錯誤:", error);
            await showToast(
              error.message === "User is already in a family"
                ? "You are already in a family and cannot join another"
                : `Failed to join family: ${error.message}`,
              2000,
              "danger"
            );
            await fetchFamilies(); // Refresh list
          }
        });
      });
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/serviceworker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

## public/forgot-password.html

```html
<!DOCTYPE html>
<html lang="zh-HK">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - 忘記密碼</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      ion-spinner[hidden] {
        display: none !important;
      }
      .error {
        color: var(--ion-color-danger, #ff0000);
        font-size: 12px;
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-content class="ion-padding">
        <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
        <ion-card>
          <ion-card-header>
            <ion-card-title>忘記密碼</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form id="forgot-password-form">
              <ion-list>
                <ion-item>
                  <ion-input
                    id="email"
                    name="email"
                    type="email"
                    label="電子郵件"
                    required
                    clear-input
                  ></ion-input>
                  <div id="email-error" class="error" hidden>請輸入有效的電子郵件地址</div>
                </ion-item>
              </ion-list>
              <ion-button id="submit-button" expand="block" type="submit">
                提交
                <ion-spinner name="crescent" hidden></ion-spinner>
              </ion-button>
              <p class="ion-text-center">
                返回 <a href="/login.html">登錄</a>
              </p>
            </form>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM loaded for forgot-password.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");

        const forgotForm = document.getElementById("forgot-password-form");
        const emailInput = document.getElementById("email");
        const submitButton = document.getElementById("submit-button");
        const emailError = document.getElementById("email-error");
        let isSubmitting = false;

        // 動態 API URL
        const API_BASE_URL = window.location.hostname === 'www.mysandshome.com'
          ? 'https://www.mysandshome.com'
          : 'http://localhost:8100';

        // 初始化錯誤訊息和按鈕狀態
        emailError.hidden = true;
        submitButton.disabled = false;
        console.log("Initial state:", { emailError: emailError.hidden, submitButtonDisabled: submitButton.disabled });

        // Toast 顯示輔助函數
        async function showToast(message, duration, color) {
          console.log(`Showing toast: ${message}`);
          try {
            const toast = document.createElement("ion-toast");
            toast.message = message;
            toast.duration = duration;
            toast.color = color;
            document.body.appendChild(toast);
            await toast.present();
            await toast.onDidDismiss();
            console.log(`Toast dismissed: ${message}`);
          } catch (error) {
            console.error("Toast error:", error);
            alert(message);
          }
        }

        // 輸入驗證
        emailInput?.addEventListener("ionInput", (e) => {
          const value = e.target.value?.trim() || "";
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          emailError.hidden = isValidEmail;
          console.log("Email input:", { value, valid: isValidEmail });
          updateButtonState();
        });

        // 更新按鈕狀態
        function updateButtonState() {
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
          submitButton.disabled = !emailValid;
          console.log("Button state updated:", { emailValid, disabled: submitButton.disabled });
        }

        // 表單提交
        forgotForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (isSubmitting) {
            console.log("Form submission blocked: Already submitting");
            return;
          }

          console.log("Form submission started");
          isSubmitting = true;
          const email = emailInput.value.trim();

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log("Validation failed: Invalid email");
            await showToast("請輸入有效的電子郵件地址", 2000, "danger");
            isSubmitting = false;
            return;
          }

          submitButton.disabled = true;
          const spinner = submitButton.querySelector("ion-spinner");
          spinner.hidden = false;
          console.log("Spinner shown");

          try {
            const forgotUrl = `${API_BASE_URL}/forgot-password`;
            console.log("Sending forgot password request to:", forgotUrl);
            const response = await fetch(forgotUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            console.log("Response received:", {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            });

            const data = await response.json();
            console.log("Response data:", data);

            if (!data.success) {
              throw new Error(data.error || "Failed to send reset link");
            }

            await showToast("密碼重置連結已發送到您的郵箱", 2000, "success");
            console.log("Redirecting to /login.html");
            setTimeout(() => {
              window.location.href = "/login.html";
            }, 2000);
          } catch (error) {
            console.error("Forgot password error:", { message: error.message, stack: error.stack });
            await showToast(`發送重置連結失敗：${error.message}`, 2000, "danger");
          } finally {
            console.log("Finalizing forgot password attempt");
            isSubmitting = false;
            submitButton.disabled = false;
            spinner.hidden = true;
            setTimeout(() => {
              if (!spinner.hidden) {
                console.warn("Spinner still visible, forcing hide");
                spinner.hidden = true;
                spinner.style.display = 'none';
              }
            }, 100);
          }
        });
      });
    </script>
  </body>
</html>
```

## public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Login</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <ion-app>
      <ion-menu content-id="main-content" side="start">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item id="nav-dashboard"><ion-icon name="home-outline"></ion-icon>Dashboard</ion-item>
            <ion-item id="nav-calendar"><ion-icon name="calendar-outline"></ion-icon>Calendar</ion-item>
            <ion-item id="nav-tasks"><ion-icon name="checkbox-outline"></ion-icon>Tasks</ion-item>
            <ion-item id="nav-chat"><ion-icon name="chatbubble-outline"></ion-icon>Chat</ion-item>
            <ion-item id="nav-family"><ion-icon name="people-outline"></ion-icon>Family</ion-item>
            <ion-item id="signOut"><ion-icon name="log-out-outline"></ion-icon>Sign Out</ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>S&S Family App</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
          <div class="welcome-message">
            <h2>Welcome, <span id="welcomeUsername">Guest</span>!</h2>
            <p>Connect with your family, plan events, and share moments.</p>
          </div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Quick Actions</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-grid>
                <ion-row>
                  <ion-col size="12" size-md="6">
                    <ion-button expand="block" id="btn-calendar">
                      <ion-icon name="calendar-outline" slot="start"></ion-icon>
                      View Calendar
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="6">
                    <ion-button expand="block" id="btn-tasks">
                      <ion-icon name="checkbox-outline" slot="start"></ion-icon>
                      Manage Tasks
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="6">
                    <ion-button expand="block" id="btn-chat">
                      <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
                      Family Chat
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="6">
                    <ion-button expand="block" id="btn-family">
                      <ion-icon name="people-outline" slot="start"></ion-icon>
                      Manage Family
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>
          <ion-fab vertical="bottom" horizontal="end" slot="fixed">
            <ion-fab-button color="primary">
              <ion-icon name="add-outline"></ion-icon>
            </ion-fab-button>
            <ion-fab-list side="top">
              <ion-fab-button id="fab-calendar" color="light"><ion-icon name="calendar-outline"></ion-icon></ion-fab-button>
              <ion-fab-button id="fab-tasks" color="light"><ion-icon name="checkbox-outline"></ion-icon></ion-fab-button>
              <ion-fab-button id="fab-chat" color="light"><ion-icon name="chatbubble-outline"></ion-icon></ion-fab-button>
            </ion-fab-list>
          </ion-fab>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small" class="ion-text-center">
              © 2025 S&S Family App. All rights reserved.
            </ion-title>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", function () {
        console.log("DOM loaded for index.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to /login.html");
          window.location.href = "/login.html";
          return;
        }

        // Menu navigation
        const navItems = {
          "nav-dashboard": "/index.html",
          "nav-calendar": "/calendar.html",
          "nav-tasks": "/tasks.html",
          "nav-chat": "/chat.html",
          "nav-family": "/family.html",
        };
        Object.keys(navItems).forEach((id) => {
          const item = document.getElementById(id);
          item.addEventListener("click", () => {
            const url = navItems[id];
            console.log(`Navigating to ${url}`);
            window.location.href = url;
          });
        });

        // Button navigation
        const buttonNav = {
          "btn-calendar": "/calendar.html",
          "btn-tasks": "/tasks.html",
          "btn-chat": "/chat.html",
          "btn-family": "/family.html",
          "fab-calendar": "/calendar.html",
          "fab-tasks": "/tasks.html",
          "fab-chat": "/chat.html",
        };
        Object.keys(buttonNav).forEach((id) => {
          const button = document.getElementById(id);
          button.addEventListener("click", () => {
            const url = buttonNav[id];
            console.log(`Button clicked, navigating to ${url}`);
            window.location.href = url;
          });
        });

        // Sign out
        document.getElementById("signOut").addEventListener("click", () => {
          console.log("Sign out clicked");
          localStorage.removeItem("token");
          console.log("Logged out, cleared token");
          window.location.href = "/login.html";
        });

        // Fetch user
        async function fetchUser() {
          try {
            console.log("Fetching user info");
            const response = await fetch("/user", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("Fetch user response:", data);
            if (!response.ok) {
              throw new Error(data.error || "Failed to fetch user data");
            }
            return {
              username: data.username || "Guest",
              email: data.email || "No email",
            };
          } catch (err) {
            console.error("Error fetching user:", err);
            localStorage.removeItem("token");
            window.location.href = "/login.html";
            return { username: "Guest", email: "Not logged in" };
          }
        }

        // Update welcome message
        async function updateWelcomeMessage() {
          try {
            const user = await fetchUser();
            document.getElementById("welcomeUsername").textContent = user.username;
          } catch (err) {
            document.getElementById("welcomeUsername").textContent = "Guest";
          }
        }

        updateWelcomeMessage();
      });
    </script>
    <script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceworker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }
</script>
  </body>
</html>
```

## public/login.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Login</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      ion-spinner[hidden] {
        display: none !important;
      }
      .error {
        color: var(--ion-color-danger, #ff0000);
        font-size: 12px;
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-content class="ion-padding">
        <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
        <ion-card>
          <ion-card-header>
            <ion-card-title>Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form id="login_form">
              <ion-list>
                <ion-item>
                  <ion-input id="username" name="username" type="text" label="Username" required clear-input></ion-input>
                  <div id="username_error" class="error" hidden>Username is required</div>
                </ion-item>
                <ion-item>
                  <ion-input id="password" name="password" type="password" label="Password" required clear-input></ion-input>
                  <div id="password_error" class="error" hidden>Password is required</div>
                  <ion-icon id="togglePassword" name="eye-outline" slot="end"></ion-icon>
                </ion-item>
              </ion-list>
              <ion-button id="login_button" expand="block" type="submit">
                Login
                <ion-spinner name="crescent" hidden></ion-spinner>
              </ion-button>
              <p class="ion-text-center">
                Don't have an account? <a href="/register.html">Register</a> | 
                <a href="/forgot-password.html">Forgot Password?</a>
              </p>
            </form>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM loaded for login.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");

        const loginForm = document.getElementById("login_form");
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const togglePassword = document.getElementById("togglePassword");
        const loginButton = document.getElementById("login_button");
        const usernameError = document.getElementById("username_error");
        const passwordError = document.getElementById("password_error");
        let isSubmitting = false;

        // 動態 API URL
        const API_BASE_URL = window.location.hostname === 'www.mysandshome.com'
          ? 'https://www.mysandshome.com'
          : 'http://localhost:8100';

        // 初始化錯誤訊息和按鈕狀態
        usernameError.hidden = true;
        passwordError.hidden = true;
        loginButton.disabled = false;
        console.log("Initial state:", { usernameError: usernameError.hidden, passwordError: passwordError.hidden, loginButtonDisabled: loginButton.disabled });

        // Toast 顯示輔助函數
        async function showToast(message, duration, color) {
          console.log(`Showing toast: ${message}`);
          try {
            const toast = document.createElement("ion-toast");
            toast.message = message;
            toast.duration = duration;
            toast.color = color;
            document.body.appendChild(toast);
            await toast.present();
            await toast.onDidDismiss();
            console.log(`Toast dismissed: ${message}`);
          } catch (error) {
            console.error("Toast error:", error);
            alert(message);
          }
        }

        // 輸入驗證
        usernameInput?.addEventListener("ionInput", (e) => {
          const value = e.target.value?.trim() || "";
          usernameError.hidden = value.length > 0;
          console.log("Username input:", { value, length: value.length, valid: usernameError.hidden });
          updateButtonState();
        });

        passwordInput?.addEventListener("ionInput", (e) => {
          const value = e.target.value?.trim() || "";
          passwordError.hidden = value.length > 0;
          console.log("Password input:", { value, length: value.length, valid: passwordError.hidden });
          updateButtonState();
        });

        // 更新按鈕狀態
        function updateButtonState() {
          const usernameValid = usernameInput.value.trim().length > 0;
          const passwordValid = passwordInput.value.trim().length > 0;
          loginButton.disabled = !(usernameValid && passwordValid);
          console.log("Button state updated:", { usernameValid, passwordValid, disabled: loginButton.disabled });
        }

        // 切換密碼可見性
        togglePassword?.addEventListener("click", () => {
          const type = passwordInput.type === "password" ? "text" : "password";
          passwordInput.type = type;
          togglePassword.name = type === "password" ? "eye-outline" : "eye-off-outline";
          console.log("Toggled password visibility:", { type });
        });

        // 表單提交
        loginForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (isSubmitting) {
            console.log("Form submission blocked: Already submitting");
            return;
          }

          console.log("Form submission started");
          isSubmitting = true;
          const formData = new FormData(loginForm);
          const username = formData.get("username")?.toString().trim();
          const password = formData.get("password")?.toString().trim();

          console.log("Login attempt:", { username, passwordLength: password?.length });

          if (!username || !password) {
            console.log("Validation failed: Username or password missing");
            await showToast("Username and password are required", 2000, "danger");
            isSubmitting = false;
            return;
          }

          loginButton.disabled = true;
          const spinner = loginButton.querySelector("ion-spinner");
          spinner.hidden = false;
          console.log("Spinner shown");

          try {
            const loginUrl = `${API_BASE_URL}/login`;
            console.log("Sending login request to:", loginUrl);
            const response = await fetch(loginUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
            });

            console.log("Response received:", {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            });

            const data = await response.json();
            console.log("Response data:", data);

            if (!data.success) {
              throw new Error(data.error || "Login failed");
            }

            const token = data.data.token;
            console.log("Token received:", { tokenLength: token.length });

            sessionStorage.setItem("token", token);
            localStorage.removeItem("token");
            console.log("Token stored in sessionStorage");

            await showToast("Login Successful", 2000, "success");
            console.log("Redirecting to /family.html");
            window.location.href = "/family.html";
          } catch (error) {
            console.error("Login error:", { message: error.message, stack: error.stack });
            await showToast(`Failed to login: ${error.message}`, 2000, "danger");
          } finally {
            console.log("Finalizing login attempt");
            isSubmitting = false;
            loginButton.disabled = false;
            spinner.hidden = true;
            setTimeout(() => {
              if (!spinner.hidden) {
                console.warn("Spinner still visible, forcing hide");
                spinner.hidden = true;
                spinner.style.display = 'none';
              }
            }, 100);
          }
        });
      });
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/serviceworker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

## public/manifest.json

```json
{
  "name": "Family App",
  "short_name": "FamilyApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFE4E1",
  "theme_color": "#FF8A9B",
  "icons": [
    {
      "src": "/assets/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## public/register.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Register</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.2.1/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <ion-app>
      <ion-content class="ion-padding">
        <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
        <ion-card>
          <ion-card-header>
            <ion-card-title>Register</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form id="register_form">
              <ion-list>
                <ion-item>
                  <ion-label position="floating">Username</ion-label>
                  <ion-input id="username" name="username" type="text" required></ion-input>
                  <div id="username_error" class="error" hidden>Username must be 3-32 characters</div>
                </ion-item>
                <ion-item>
                  <ion-label position="floating">Email</ion-label>
                  <ion-input id="email" name="email" type="email"></ion-input>
                  <div id="email_error" class="error" hidden>Please enter a valid email</div>
                </ion-item>
                <ion-item>
                  <ion-label position="floating">Password</ion-label>
                  <ion-input id="password" name="password" type="password" required></ion-input>
                  <div id="password_error" class="error" hidden>Password must be at least 6 characters</div>
                  <ion-icon id="togglePassword" name="eye-outline" slot="end"></ion-icon>
                </ion-item>
              </ion-list>
              <ion-button expand="block" type="submit">Register</ion-button>
              <p class="ion-text-center">
                Already have an account? <a href="/login.html">Login</a>
              </p>
            </form>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM loaded for register.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");

        // Menu navigation
        const navItems = {
          "nav-login": "/login.html",
          "nav-register": "/register.html",
        };
        Object.keys(navItems).forEach((id) => {
          const item = document.getElementById(id);
          if (item) {
            item.addEventListener("click", () => {
              console.log(`Navigating to ${navItems[id]}`);
              window.location.href = navItems[id];
            });
          }
        });

        // Check for existing token
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          console.log("Token found, redirecting to /calendar.html");
          window.location.href = "/calendar.html";
          return;
        }
        console.log("No token found, staying on register page");

        const registerForm = document.getElementById("register_form");
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const emailInput = document.getElementById("email");
        const togglePassword = document.getElementById("togglePassword");
        const usernameError = document.getElementById("username_error");
        const passwordError = document.getElementById("password_error");
        const emailError = document.getElementById("email_error");

        // Input validation with visual feedback
        usernameInput?.addEventListener("input", () => {
          const username = usernameInput.value.trim();
          if (username.length < 3 || username.length > 32) {
            usernameInput.setCustomValidity("Username must be 3-32 characters.");
            usernameError.hidden = false;
          } else {
            usernameInput.setCustomValidity("");
            usernameError.hidden = true;
          }
        });

        passwordInput?.addEventListener("input", () => {
          const password = passwordInput.value;
          if (password.length < 6) {
            passwordInput.setCustomValidity("Password must be at least 6 characters.");
            passwordError.hidden = false;
          } else {
            passwordInput.setCustomValidity("");
            passwordError.hidden = true;
          }
        });

        emailInput?.addEventListener("input", () => {
          const email = emailInput.value.trim();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailInput.setCustomValidity("Please enter a valid email.");
            emailError.hidden = false;
          } else {
            emailInput.setCustomValidity("");
            emailError.hidden = true;
          }
        });

        // Toggle password visibility
        togglePassword?.addEventListener("click", () => {
          const type = passwordInput.type === "password" ? "text" : "password";
          passwordInput.type = type;
          togglePassword.name = type === "password" ? "eye-outline" : "eye-off-outline";
        });

        // Form submission
        registerForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          console.log("Form submitted");
          const formData = new FormData(registerForm);
          const username = formData.get("username")?.toString().trim();
          const email = formData.get("email")?.toString().trim() || null;
          const password = formData.get("password")?.toString().trim();

          // Additional validation before sending
          if (!username || !password) {
            const toast = document.createElement("ion-toast");
            toast.message = "Username and password are required";
            toast.duration = 2000;
            toast.color = "danger";
            document.body.appendChild(toast);
            await toast.present();
            return;
          }

          console.log("Register attempt:", { username, email });

          try {
            const response = await fetch("/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            console.log("Register response:", data);

            if (!data.success) {
              throw new Error(data.error || "Registration failed");
            }

            const toast = document.createElement("ion-toast");
            toast.message = "Registration Successful";
            toast.duration = 2000;
            toast.color = "success";
            document.body.appendChild(toast);
            await toast.present();

            console.log("Redirecting to /login.html");
            window.location.href = "/login.html";
          } catch (error) {
            console.error("Register error:", error.message);
            const toast = document.createElement("ion-toast");
            toast.message = `Failed to register: ${error.message}`;
            toast.duration = 2000;
            toast.color = "danger";
            document.body.appendChild(toast);
            await toast.present();
          }
        });
      });
    </script>
    <script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceworker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }
</script>
  </body>
</html>
```

## public/reset-password.html

```html
<!DOCTYPE html>
<html lang="zh-HK">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - 重置密碼</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      ion-spinner[hidden] {
        display: none !important;
      }
      .error {
        color: var(--ion-color-danger, #ff0000);
        font-size: 12px;
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-content class="ion-padding">
        <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
        <ion-card>
          <ion-card-header>
            <ion-card-title>重置密碼</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form id="reset-password-form">
              <ion-list>
                <ion-item>
                  <ion-input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    label="新密碼"
                    required
                    clear-input
                    minlength="6"
                  ></ion-input>
                  <div id="new-password-error" class="error" hidden>密碼必須至少6個字符</div>
                  <ion-icon id="togglePassword" name="eye-outline" slot="end"></ion-icon>
                </ion-item>
              </ion-list>
              <ion-button id="reset-button" expand="block" type="submit">
                提交
                <ion-spinner name="crescent" hidden></ion-spinner>
              </ion-button>
              <p class="ion-text-center">
                返回 <a href="/login.html">登錄</a>
              </p>
            </form>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-app>

    <script>
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM loaded for reset-password.html");
        console.log("Ionic version:", window.Ionic?.version || "Not loaded");

        const resetForm = document.getElementById("reset-password-form");
        const newPasswordInput = document.getElementById("new-password");
        const togglePassword = document.getElementById("togglePassword");
        const resetButton = document.getElementById("reset-button");
        const newPasswordError = document.getElementById("new-password-error");
        let isSubmitting = false;

        // 動態 API URL
        const API_BASE_URL = window.location.hostname === 'www.mysandshome.com'
          ? 'https://www.mysandshome.com'
          : 'http://localhost:8100';

        // 從 URL 獲取 token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        console.log("Token from URL:", { tokenLength: token?.length });

        // 初始化錯誤訊息和按鈕狀態
        newPasswordError.hidden = true;
        resetButton.disabled = false;
        console.log("Initial state:", { newPasswordError: newPasswordError.hidden, resetButtonDisabled: resetButton.disabled });

        // Toast 顯示輔助函數
        async function showToast(message, duration, color) {
          console.log(`Showing toast: ${message}`);
          try {
            const toast = document.createElement("ion-toast");
            toast.message = message;
            toast.duration = duration;
            toast.color = color;
            document.body.appendChild(toast);
            await toast.present();
            await toast.onDidDismiss();
            console.log(`Toast dismissed: ${message}`);
          } catch (error) {
            console.error("Toast error:", error);
            alert(message); // 後備方案
          }
        }

        // 輸入驗證
        newPasswordInput?.addEventListener("ionInput", (e) => {
          const value = e.target.value?.trim() || "";
          newPasswordError.hidden = value.length >= 6;
          console.log("New password input:", { value, length: value.length, valid: newPasswordError.hidden });
          updateButtonState();
        });

        // 更新按鈕狀態
        function updateButtonState() {
          const newPasswordValid = newPasswordInput.value.trim().length >= 6;
          resetButton.disabled = !newPasswordValid;
          console.log("Button state updated:", { newPasswordValid, disabled: resetButton.disabled });
        }

        // 切換密碼可見性
        togglePassword?.addEventListener("click", () => {
          const type = newPasswordInput.type === "password" ? "text" : "password";
          newPasswordInput.type = type;
          togglePassword.name = type === "password" ? "eye-outline" : "eye-off-outline";
          console.log("Toggled password visibility:", { type });
        });

        // 表單提交
        resetForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (isSubmitting) {
            console.log("Form submission blocked: Already submitting");
            return;
          }

          console.log("Form submission started");
          isSubmitting = true;
          const newPassword = newPasswordInput.value.trim();

          if (!token) {
            console.log("Validation failed: Token missing");
            await showToast("無效的密碼重置連結", 2000, "danger");
            isSubmitting = false;
            return;
          }

          if (!newPassword || newPassword.length < 6) {
            console.log("Validation failed: Invalid password");
            await showToast("密碼必須至少6個字符", 2000, "danger");
            isSubmitting = false;
            return;
          }

          resetButton.disabled = true;
          const spinner = resetButton.querySelector("ion-spinner");
          spinner.hidden = false;
          console.log("Spinner shown");

          try {
            const resetUrl = `${API_BASE_URL}/reset-password`;
            console.log("Sending reset request to:", resetUrl);
            const response = await fetch(resetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, newPassword }),
            });

            console.log("Response received:", {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            });

            const data = await response.json();
            console.log("Response data:", data);

            if (!data.success) {
              throw new Error(data.error || "Password reset failed");
            }

            await showToast("密碼重置成功，請重新登錄", 2000, "success");
            console.log("Redirecting to /login.html");
            window.location.href = "/login.html";
          } catch (error) {
            console.error("Reset password error:", { message: error.message, stack: error.stack });
            await showToast(`密碼重置失敗：${error.message}`, 2000, "danger");
          } finally {
            console.log("Finalizing reset attempt");
            isSubmitting = false;
            resetButton.disabled = false;
            spinner.hidden = true;
            setTimeout(() => {
              if (!spinner.hidden) {
                console.warn("Spinner still visible, forcing hide");
                spinner.hidden = true;
                spinner.style.display = 'none';
              }
            }, 100);
          }
        });
      });
    </script>
  </body>
</html>
```

## public/serviceworker.js

```js
const CACHE_NAME = 'family-app-cache-v6'; // Updated version
const urlsToCache = [
  '/index.html',
  '/styles.css',
  '/client.js',
  '/assets/family-logo.png', // Replaced favicon.png with an existing file
];

// 安裝時快取資源，但不自動 skipWaiting，讓新版等待用戶關閉所有分頁才啟用
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => {
        console.log(`Service Worker installed with cache: ${CACHE_NAME}`);
        // 不自動啟用新版，避免用戶頻繁收到更新提示
        // return self.skipWaiting();
      })
      .catch(err => console.error('Cache addAll failed:', err))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => {
      console.log(`Service Worker activated: ${CACHE_NAME}`);
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request) || caches.match('/index.html'))
  );
});

// 處理推播通知
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Family App', body: 'You have a new reminder!' };
  }
  const title = data.title || 'Family App';
  const options = {
    body: data.body || 'You have a new reminder!',
    icon: '/assets/family-logo.png',
    badge: '/assets/family-logo.png',
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 點擊通知時的行為
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/calendar.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

## public/styles.css

```css
:root {
  --primary-pink: #FFC1CC; /* Soft pink for buttons and highlights */
  --light-pink: #FFE4E1; /* Backgrounds and cards */
  --dark-pink: #FF8A9B; /* Toolbar and accents */
  --text-dark: #333333; /* Main text color */
  --text-light: #FFFFFF; /* Text on dark backgrounds */
  --family-font: 'Poppins', sans-serif; /* Playful, family-friendly font */
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
}

body {
  font-family: var(--family-font);
  background: var(--light-pink);
}

ion-app {
  --background: var(--light-pink);
}

ion-toolbar {
  --background: var(--dark-pink);
  --color: var(--text-light);
  --border-radius: 8px;
}

ion-content {
  --background: var(--light-pink);
  --overflow: auto;
}

ion-card {
  background: var(--text-light);
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin: 16px auto;
  max-width: 600px;
  transition: transform 0.3s ease;
}

ion-card:hover {
  transform: translateY(-4px);
}

ion-button {
  --background: var(--primary-pink);
  --color: var(--text-dark);
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  font-weight: 600;
  text-transform: none;
  transition: background 0.3s ease;
}

ion-button:hover {
  --background: var(--dark-pink);
  --color: var(--text-light);
}

ion-menu {
  --background: var(--text-light);
  --color: var(--text-dark);
}

ion-menu ion-item {
  --background: var(--text-light);
  --color: var(--text-dark);
  --background-activated: var(--primary-pink);
  --color-activated: var(--text-dark);
  font-size: 16px;
  border-radius: 8px;
  margin: 8px;
}

ion-icon {
  margin-right: 8px;
}

.family-logo {
  display: block;
  margin: 16px auto;
  width: 100px;
  height: auto;
}

.welcome-message {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, var(--primary-pink), var(--light-pink));
  border-radius: 12px;
  margin: 16px;
  color: var(--text-dark);
}

ion-list {
  max-height: 100%;
  overflow-y: auto;
}

ion-label {
  white-space: normal !important;
  overflow-wrap: break-word;
}

@media (max-width: 768px) {
  ion-card {
    max-width: 90%;
  }
  ion-menu ion-item {
    font-size: 14px;
  }
  .welcome-message {
    padding: 16px;
  }
  ion-avatar {
    width: 32px;
    height: 32px;
    margin-right: 4px;
  }
  ion-button[slot="end"] {
    margin-left: 4px;
    --padding-start: 8px;
    --padding-end: 8px;
  }
}
```

## public/tasks.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>S&S Family App - Tasks</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.esm.js"></script>
    <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/dist/ionic/ionic.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core@7.8.4/css/ionic.bundle.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="manifest" href="/manifest.json">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    <script src="/client.js"></script>
    <style>
      ion-item.completed {
        --background: var(--light-pink);
        opacity: 0.8;
      }
      ion-avatar {
        width: 40px;
        height: 40px;
        margin-right: 8px;
      }
      .search-bar {
        margin-bottom: 16px;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-menu content-id="main-content" side="start">
        <ion-header>
          <ion-toolbar>
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item id="nav-calendar"><ion-icon name="calendar-outline"></ion-icon>Calendar</ion-item>
            <ion-item id="nav-tasks"><ion-icon name="checkbox-outline"></ion-icon>Tasks</ion-item>
            <ion-item id="nav-chat"><ion-icon name="chatbubble-outline"></ion-icon>Chat</ion-item>
            <ion-item id="nav-family"><ion-icon name="people-outline"></ion-icon>Family</ion-item>
            <ion-item id="signOut"><ion-icon name="log-out-outline"></ion-icon>Sign Out</ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>S&S Family App - Tasks</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img src="/assets/family-logo.png" alt="Family Logo" class="family-logo" />
          <div class="welcome-message">
            <h2>Family Tasks</h2>
            <p>Share tasks with family and stay organized.</p>
          </div>
          <!-- Search and Sort -->
          <ion-item class="search-bar">
            <ion-input id="search" label="Search Tasks" placeholder="Search tasks..." debounce="300"></ion-input>
            <ion-select id="sort" slot="end" interface="popover" label="Sort" placeholder="Sort">
              <ion-select-option value="due_date_asc">Due Date (Earliest)</ion-select-option>
              <ion-select-option value="due_date_desc">Due Date (Latest)</ion-select-option>
              <ion-select-option value="priority_desc">Priority (High to Low)</ion-select-option>
              <ion-select-option value="priority_asc">Priority (Low to High)</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-list id="task_list"></ion-list>
          <ion-card>
            <ion-card-header>
              <ion-card-title id="form-title">Add Task</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <form id="task_form" class="ion-padding">
                <input type="hidden" id="task_id" name="task_id" />
                <ion-grid>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-input
                          type="text"
                          name="title"
                          id="title"
                          label="Task Title"
                          label-placement="stacked"
                          placeholder="Enter task title"
                          required
                        ></ion-input>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-textarea
                          name="description"
                          id="description"
                          label="Description (Optional)"
                          label-placement="stacked"
                          placeholder="Enter task description"
                        ></ion-textarea>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-select
                          name="assignee_id"
                          id="assignee_id"
                          label="Assignee (Optional)"
                          label-placement="stacked"
                          placeholder="Select family member"
                          interface="action-sheet"
                        ></ion-select>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-datetime
                          name="due_date"
                          id="due_date"
                          label="Due Date (Optional)"
                          label-placement="stacked"
                          display-format="YYYY-MM-DD"
                        ></ion-datetime>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-item>
                        <ion-select name="priority" id="priority" label="Priority" value="medium">
                          <ion-select-option value="low">Low</ion-select-option>
                          <ion-select-option value="medium">Medium</ion-select-option>
                          <ion-select-option value="high">High</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col size="6">
                      <ion-button expand="block" type="submit" id="submit_task">Add Task</ion-button>
                    </ion-col>
                    <ion-col size="6">
                      <ion-button expand="block" fill="outline" id="cancel_edit" style="display: none;">Cancel Edit</ion-button>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </form>
            </ion-card-content>
          </ion-card>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small" class="ion-text-center">
              © 2025 S&S Family App. All rights reserved.
            </ion-title>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-app>

    <script>
      // Define API base URL, dynamically set based on environment
      const API_BASE_URL = window.location.hostname === 'www.mysandshome.com'
        ? 'https://www.mysandshome.com'
        : 'http://localhost:8100';

      // HTML escape function to handle special characters
      function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      document.addEventListener("DOMContentLoaded", async () => {
        console.log("DOM 已載入 tasks.html");
        console.log("Ionic 版本:", window.Ionic?.version || "未載入");
        const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
        if (!token) {
          console.log("未找到 token，正在跳轉到 /login.html");
          await showToast("Please log in to view tasks", 2000, "warning");
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

        // Alert confirmation helper function
        async function showConfirm(message) {
          return new Promise((resolve) => {
            const alert = document.createElement("ion-alert");
            alert.header = "Confirm";
            alert.message = message;
            alert.buttons = [
              { text: "Cancel", role: "cancel", handler: () => resolve(false) },
              { text: "Confirm", handler: () => resolve(true) },
            ];
            document.body.appendChild(alert);
            alert.present();
          });
        }

        async function checkFamilyStatus() {
          try {
            console.log("檢查用戶家庭狀態");
            const response = await fetch(`${API_BASE_URL}/my-families`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("檢查家庭狀態回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              throw new Error(data.error || "Failed to check family status");
            }
            const hasFamily = Array.isArray(data.data?.families) && data.data.families.length > 0;
            const familyId = hasFamily ? data.data.families[0].id : null;
            return { hasFamily, familyId };
          } catch (error) {
            console.error("檢查家庭狀態錯誤:", error);
            await showToast(`Failed to check family status: ${error.message}`, 2000, "danger");
            return { hasFamily: false, familyId: null };
          }
        }

        const taskList = document.getElementById("task_list");
        const taskForm = document.getElementById("task_form");
        const submitTaskButton = document.getElementById("submit_task");
        const cancelEditButton = document.getElementById("cancel_edit");
        const formTitle = document.getElementById("form-title");
        const taskIdInput = document.getElementById("task_id");
        const assigneeSelect = document.getElementById("assignee_id");
        const searchInput = document.getElementById("search");
        const sortSelect = document.getElementById("sort");

        // Check family status
        const { hasFamily, familyId } = await checkFamilyStatus();
        if (!hasFamily) {
          await showToast("You have not joined any family. Please create or join a family first.", 3000, "warning");
          taskList.innerHTML = `<ion-item><ion-label>Please create or join a family to view and manage tasks</ion-label></ion-item>`;
          submitTaskButton.disabled = true;
          assigneeSelect.innerHTML = '<ion-select-option value="">None</ion-select-option>';
          return;
        } else {
          console.log("用戶已加入家庭，家庭 ID:", familyId);
          submitTaskButton.disabled = false;
        }

        async function fetchFamilyMembers() {
          try {
            console.log("正在獲取家庭成員，家庭 ID:", familyId);
            console.log("使用 token:", token.substring(0, 20) + "...");
            const response = await fetch(`${API_BASE_URL}/family/members?family_id=${familyId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("獲取家庭成員回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              if (response.status === 401) {
                console.log("401 Unauthorized: 無效 token 或未登錄");
                await showToast("Authentication failed, please log in again", 3000, "danger");
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                window.location.href = "/login.html";
                return;
              }
              throw new Error(data.error || "Failed to fetch family members");
            }
            assigneeSelect.innerHTML = '<ion-select-option value="">None</ion-select-option>';
            if (Array.isArray(data.data?.members) && data.data.members.length > 0) {
              console.log("家庭成員數量:", data.data.members.length);
              data.data.members.forEach((member) => {
                const option = document.createElement("ion-select-option");
                option.value = member.user_id;
                option.textContent = escapeHtml(member.username);
                assigneeSelect.appendChild(option);
                console.log(`已添加成員選項: ${member.username} (ID: ${member.user_id})`);
              });
              console.log("最終 assigneeSelect HTML:", assigneeSelect.innerHTML);
              assigneeSelect.dispatchEvent(new CustomEvent("ionChange")); // 觸發 Ionic 更新
            } else {
              console.warn("無家庭成員或數據格式不正確:", data);
              assigneeSelect.innerHTML = '<ion-select-option value="">No family members available</ion-select-option>';
              await showToast("No family members available to assign tasks", 3000, "warning");
            }
          } catch (error) {
            console.error("獲取家庭成員錯誤:", error);
            assigneeSelect.innerHTML = '<ion-select-option value="">Error loading members</ion-select-option>';
            await showToast(`Failed to load family members: ${error.message}`, 2000, "danger");
          }
        }

        async function fetchTasks(query = "", sort = "") {
          try {
            console.log("正在獲取任務列表", { query, sort });
            const url = new URL(`${API_BASE_URL}/tasks`);
            if (query) url.searchParams.append("q", query);
            if (sort) url.searchParams.append("sort", sort);
            console.log("最終請求 URL:", url.toString());
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("獲取任務回應 (完整):", JSON.stringify(data, null, 2));
            if (!response.ok) {
              if (response.status === 401) {
                await showToast("Authentication failed, please log in again", 3000, "danger");
                window.location.href = "/login.html";
                return [];
              }
              throw new Error(data.error || "Failed to fetch tasks");
            }
            const tasks = Array.isArray(data.data?.tasks) ? data.data.tasks : [];
            console.log("解析後的任務列表:", tasks);
            return tasks;
          } catch (error) {
            console.error("獲取任務錯誤:", error);
            await showToast(`Failed to load task list: ${error.message}`, 2000, "danger");
            return [];
          }
        }

        async function renderTasks(query = "", sort = "") {
          try {
            await fetchFamilyMembers();
            let tasks = await fetchTasks(query, sort);
            console.log("渲染任務數量:", tasks.length);
            taskList.innerHTML = "";
            if (tasks.length === 0) {
              console.log("任務列表為空，顯示 'No tasks found'");
              taskList.innerHTML = `<ion-item><ion-label>No tasks found</ion-label></ion-item>`;
            } else {
              tasks.forEach((task) => {
                // 資料預處理
                task.title = escapeHtml(task.title || "Untitled Task");
                task.description = escapeHtml(task.description || "No description");
                task.assignee_username = escapeHtml(task.assignee_username || "None");
                task.due_date = task.due_date && !isNaN(new Date(task.due_date).getTime()) ? task.due_date : null;
                task.priority = ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium";
                task.status = ["pending", "completed"].includes(task.status) ? task.status : "pending";
                
                console.log("渲染任務:", task);
                const item = document.createElement("ion-item");
                item.className = task.status === "completed" ? "completed" : "";
                item.innerHTML = `
                  <ion-avatar slot="start">
                    <img src="/assets/user-${task.assignee_id || 'default'}.png" alt="${task.assignee_username}" onerror="this.src='/assets/user-default.png'" />
                  </ion-avatar>
                  <ion-label>
                    <h2>${task.title}</h2>
                    <p>${task.description}</p>
                    <p>Assignee: ${task.assignee_username}</p>
                    <p>Due Date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}</p>
                    <p>Priority: ${task.priority === "low" ? "Low" : task.priority === "medium" ? "Medium" : "High"}</p>
                    <p>Status: ${task.status === "pending" ? "Pending" : "Completed"}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" id="toggle-${task.id}">
                    <ion-icon name="${task.status === 'pending' ? 'checkmark-circle-outline' : 'refresh-circle-outline'}"></ion-icon>
                  </ion-button>
                  <ion-button slot="end" fill="clear" id="edit-${task.id}">
                    <ion-icon name="create-outline"></ion-icon>
                  </ion-button>
                  <ion-button slot="end" fill="clear" id="delete-${task.id}">
                    <ion-icon name="trash-outline"></ion-icon>
                  </ion-button>
                `;
                taskList.appendChild(item);
                // 添加 click 和 touchstart 事件
                const toggleButton = document.getElementById(`toggle-${task.id}`);
                const editButton = document.getElementById(`edit-${task.id}`);
                const deleteButton = document.getElementById(`delete-${task.id}`);
                toggleButton?.addEventListener("click", () => toggleTaskStatus(task.id, task.status));
                toggleButton?.addEventListener("touchstart", (e) => {
                  e.preventDefault();
                  toggleTaskStatus(task.id, task.status);
                });
                editButton?.addEventListener("click", () => editTask(task));
                editButton?.addEventListener("touchstart", (e) => {
                  e.preventDefault();
                  editTask(task);
                });
                deleteButton?.addEventListener("click", () => deleteTask(task.id));
                deleteButton?.addEventListener("touchstart", (e) => {
                  e.preventDefault();
                  deleteTask(task.id);
                });
              });
            }
          } catch (error) {
            console.error("渲染任務錯誤:", error);
            await showToast("Failed to render tasks, please try again", 2000, "danger");
          }
        }

        async function toggleTaskStatus(taskId, currentStatus) {
          const newStatus = currentStatus === "pending" ? "completed" : "pending";
          try {
            console.log(`將任務 ${taskId} 切換為 ${newStatus}`);
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            console.log("切換任務回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              if (response.status === 401) {
                await showToast("Authentication failed, please log in again", 3000, "danger");
                window.location.href = "/login.html";
                return;
              }
              throw new Error(data.error || "Failed to update task");
            }
            await showToast(`Task marked as ${newStatus === "pending" ? "Pending" : "Completed"}`, 2000, "success");
            await renderTasks(searchInput.value, sortSelect.value);
          } catch (error) {
            console.error("切換任務錯誤:", error);
            await showToast(`Failed to update task: ${error.message}`, 2000, "danger");
          }
        }

        async function editTask(task) {
          console.log("編輯任務:", task.id);
          taskIdInput.value = task.id;
          document.getElementById("title").value = task.title;
          document.getElementById("description").value = task.description || "";
          document.getElementById("assignee_id").value = task.assignee_id || "";
          document.getElementById("due_date").value = task.due_date || "";
          document.getElementById("priority").value = task.priority;
          formTitle.textContent = "Edit Task";
          submitTaskButton.textContent = "Save Task";
          cancelEditButton.style.display = "block";
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        async function deleteTask(taskId) {
          const confirmed = await showConfirm("Are you sure you want to delete this task?");
          if (!confirmed) return;
          try {
            console.log(`刪除任務 ${taskId}`);
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            console.log("刪除任務回應:", JSON.stringify(data, null, 2));
            if (!response.ok) {
              if (response.status === 401) {
                await showToast("Authentication failed, please log in again", 3000, "danger");
                window.location.href = "/login.html";
                return;
              }
              throw new Error(data.error || "Failed to delete task");
            }
            await showToast("Task deleted", 2000, "success");
            await renderTasks(searchInput.value, sortSelect.value);
          } catch (error) {
            console.error("刪除任務錯誤:", error);
            await showToast(`Failed to delete task: ${error.message}`, 2000, "danger");
          }
        }

        function resetForm() {
          taskForm.reset();
          taskIdInput.value = "";
          formTitle.textContent = "Add Task";
          submitTaskButton.textContent = "Add Task";
          cancelEditButton.style.display = "none";
        }

        cancelEditButton?.addEventListener("click", () => {
          console.log("取消編輯");
          resetForm();
        });

        searchInput?.addEventListener("ionInput", () => {
          renderTasks(searchInput.value, sortSelect.value);
        });

        sortSelect?.addEventListener("ionChange", () => {
          renderTasks(searchInput.value, sortSelect.value);
        });

        await renderTasks();

        taskForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.target;
          const formData = new FormData(form);
          const taskId = formData.get("task_id")?.toString();
          const title = formData.get("title")?.toString().trim();
          const description = formData.get("description")?.toString().trim() || null;
          const assignee_id = formData.get("assignee_id") || null;
          const due_date = formData.get("due_date")?.toString();
          const priority = formData.get("priority")?.toString() || "medium";

          if (!title) {
            await showToast("Task title is required", 2000, "danger");
            return;
          }
          if (title.length > 100) {
            await showToast("Task title must be 100 characters or less", 2000, "danger");
            return;
          }
          if (!["low", "medium", "high"].includes(priority)) {
            await showToast("Invalid priority value", 2000, "danger");
            return;
          }

          console.log("任務表單提交:", { taskId, title, description, assignee_id, due_date, priority });

          try {
            const url = taskId ? `${API_BASE_URL}/tasks/${taskId}` : `${API_BASE_URL}/tasks`;
            const method = taskId ? "PATCH" : "POST";
            const body = {
              title,
              description,
              assignee_id: assignee_id ? Number(assignee_id) : null,
              due_date: due_date ? new Date(due_date).toISOString().split("T")[0] : null,
              priority,
            };
            if (method === "PATCH") delete body.status;
            console.log(`正在發送任務${taskId ? "更新" : "創建"}請求`);
            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(body),
            });
            const data = await response.json();
            console.log(`任務${taskId ? "更新" : "創建"}回應:`, JSON.stringify(data, null, 2));
            if (!response.ok) {
              if (response.status === 401) {
                await showToast("Authentication failed, please log in again", 3000, "danger");
                window.location.href = "/login.html";
                return;
              }
              throw new Error(data.error || `Failed to ${taskId ? "update" : "create"} task`);
            }
            await showToast(`Task ${taskId ? "updated" : "created"} (ID: ${data.data?.task_id})`, 2000, "success");
            resetForm();
            await renderTasks(searchInput.value, sortSelect.value);
          } catch (error) {
            console.error(`創建/更新任務錯誤:`, error);
            await showToast(`Failed to ${taskId ? "update" : "create"} task: ${error.message}`, 2000, "danger");
          }
        });
      });
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/serviceworker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

## .env

```
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=sam1_sql_password
DB_NAME=family_app
PORT=8100
JWT_SECRET=bDiB6RXGKM96ODYWFfyXgl/9r1ar6/CgGLYfi17HKsBy94YduWwgmaIk/eIa31BF
VAPID_PUBLIC_KEY=BHQWOcRLHJmk2jhSeme_RxeBdhv9Rx4qPQ8ZMlSinSBUMOWQgP_pJnJBPnVZjFE05XOmmXg5mgaKQSQ_B6lj8e8
VAPID_PRIVATE_KEY=Mto2_dOgvBbsY7yxk-Sj6pjqTd9dyi3Rms7GTlfPQD0
VAPID_SUBJECT=mailto:testing.email111011@gmail.com
```

## server.ts

```ts
import express, { Request, Response, Application, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { print } from 'listening-on';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { exec } from 'child_process';
import { promisify } from 'util';
import webPush from 'web-push';

dotenv.config();

// Set up VAPID
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// MySQL DATETIME 格式化函數
function toMysqlDatetime(date: Date = new Date()): string {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');
}

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8100;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in .env');
  process.exit(1);
}

console.log(`JWT_SECRET loaded (length: ${JWT_SECRET.length})`);

interface AuthRequest extends Request {
  user?: { userId: number; username: string };
}

app.use(morgan('dev'));
app.use(cors());
app.use(express.static(path.join(__dirname, '../public'), {
  index: false,
  setHeaders: (res, filePath) => {
    console.log(`Serving static file: ${filePath}`);
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

let db: mysql.Pool | null = null;
async function initDb(): Promise<mysql.Pool> {
  if (db) return db;
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'app_user',
      password: process.env.DB_PASSWORD || 'sam1_sql_password',
      database: process.env.DB_NAME || 'family_app',
      port: Number(process.env.DB_PORT) || 3306,
      charset: 'utf8mb4', // 明確指定 utf8mb4 字符集
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL connected with charset: utf8mb4');

    // 確保資料庫使用 utf8mb4
    await db.query('ALTER DATABASE family_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('Database character set set to utf8mb4');

    // 創建表，明確指定 utf8mb4
    await db.query(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS family (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        owner_id INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS family_member (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS event (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        title VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME,
        reminder_datetime DATETIME,
        notified BOOLEAN DEFAULT FALSE,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 遷移：添加 notified 欄位（如果不存在）
    const [eventColumns] = await db.query('SHOW COLUMNS FROM event LIKE "notified"');
    if ((eventColumns as any[]).length === 0) {
      await db.query('ALTER TABLE event ADD COLUMN notified BOOLEAN DEFAULT FALSE');
      console.log('Added notified column to event table');
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        subscription JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS task (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        assignee_id INTEGER,
        title VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        due_date DATE,
        priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES user(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        sent_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        user_id INTEGER NOT NULL,
        token VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 遷移現有表到 utf8mb4
    const tables = ['user', 'family', 'family_member', 'event', 'push_subscriptions', 'task', 'message', 'password_reset_tokens'];
    for (const table of tables) {
      const [tableStatus] = await db.query(`SHOW TABLE STATUS WHERE Name = ?`, [table]);
      if ((tableStatus as any[])[0].Collation !== 'utf8mb4_unicode_ci') {
        await db.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Converted table ${table} to utf8mb4_unicode_ci`);
      }
    }

    // 檢查並修正特定欄位的字符集
    await db.query(`
      ALTER TABLE user 
      MODIFY COLUMN username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      MODIFY COLUMN avatar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY COLUMN email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    await db.query(`
      ALTER TABLE family 
      MODIFY COLUMN name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
    `);
    await db.query(`
      ALTER TABLE family_member 
      MODIFY COLUMN role VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member';
    `);
    await db.query(`
      ALTER TABLE event 
      MODIFY COLUMN title VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
    `);
    await db.query(`
      ALTER TABLE task 
      MODIFY COLUMN title VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    await db.query(`
      ALTER TABLE message 
      MODIFY COLUMN content VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
    `);
    await db.query(`
      ALTER TABLE password_reset_tokens 
      MODIFY COLUMN token VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
    `);

    console.log('All tables created and migrated to utf8mb4 successfully');
    return db;
  } catch (error) {
    console.error('MySQL initialization error:', error);
    throw error;
  }
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const sendResponse = (res: Response, status: number, success: boolean, data?: any, error?: string) => {
  res.status(status).json({ success, data, error });
};

// Promisify exec for async/await
const execPromise = promisify(exec);

// Subscribe to push notifications
app.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return sendResponse(res, 400, false, null, 'Invalid subscription data');
  }

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    // Check for existing subscription
    const [existing] = await db.query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND family_id = ?',
      [user_id, family.family_id]
    );
    if ((existing as any[]).length > 0) {
      // Update existing subscription
      await db.query(
        'UPDATE push_subscriptions SET subscription = ?, created_at = ? WHERE user_id = ? AND family_id = ?',
        [JSON.stringify(subscription), toMysqlDatetime(), user_id, family.family_id]
      );
    } else {
      // Insert new subscription
      await db.query(
        'INSERT INTO push_subscriptions (family_id, user_id, subscription, created_at) VALUES (?, ?, ?, ?)',
        [family.family_id, user_id, JSON.stringify(subscription), toMysqlDatetime()]
      );
    }

    console.log('Push subscription saved:', { user_id, family_id: family.family_id });
    sendResponse(res, 201, true, { message: 'Subscription saved' });
  } catch (error) {
    console.error('Save subscription error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

// Check and send notifications for due events
async function checkAndSendNotifications() {
  try {
    const db = await initDb();
    // Find events where reminder_datetime is due and not yet notified
    const [events] = await db.query(
      'SELECT e.id, e.title, e.reminder_datetime, e.family_id, u.username AS creator_username ' +
      'FROM event e JOIN user u ON e.creator_id = u.id ' +
      'WHERE e.reminder_datetime <= NOW() AND e.notified = FALSE'
    );

    for (const event of events as any[]) {
      // Get all subscriptions for the event's family
      const [subscriptions] = await db.query(
        'SELECT subscription FROM push_subscriptions WHERE family_id = ?',
        [event.family_id]
      );

      const payload = {
        title: `❤️ ${event.title} ❤️`,
        body: `⏰ Start time at ${new Date(event.reminder_datetime).toLocaleTimeString()} ⏰`
      };

      // Send notification to each subscription
      for (const sub of subscriptions as any[]) {
        try {
          await webPush.sendNotification(JSON.parse(sub.subscription), JSON.stringify(payload));
          console.log(`Notification sent for event ${event.id} to subscription`);
        } catch (error) {
          console.error(`Failed to send notification for event ${event.id}:`, error);
        }
      }

      // Mark event as notified
      await db.query('UPDATE event SET notified = TRUE WHERE id = ?', [event.id]);
      console.log(`Event ${event.id} marked as notified`);
    }
  } catch (error) {
    console.error('Notification check failed:', error);
  }
}

// Forgot Password Route
app.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log('Forgot password attempt:', { email });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendResponse(res, 400, false, null, 'Valid email is required');
  }

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT id FROM user WHERE email = ?', [email]);
    const user = (rows as any[])[0];
    if (!user) {
      console.log('User not found for email:', email);
      return sendResponse(res, 404, false, null, 'User not found');
    }

    const resetToken = jwt.sign({ userId: user.id, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
    const expiresAt = toMysqlDatetime(new Date(Date.now() + 3600000)); // 1 hour from now
    await db.query('INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES (?, ?, ?, ?)', [
      user.id,
      resetToken,
      expiresAt,
      false
    ]);

    const resetLink = `https://www.mysandshome.com/reset-password.html?token=${resetToken}`;
    const emailContent = `Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.`;
    const command = `echo "${emailContent}" | s-nail -s "S&S Family App - Password Reset" -r "testing.email111011@gmail.com" -M "text/html" ${email}`;

    try {
      await execPromise(command);
      console.log('Password reset email sent via s-nail:', { email, resetLink });
      sendResponse(res, 200, true, { message: 'Password reset link sent to your email' });
    } catch (error) {
      console.error('s-nail error:', error);
      return sendResponse(res, 500, false, null, 'Failed to send email');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

// Reset Password Route
app.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  console.log('Reset password attempt:', { tokenLength: token?.length, newPasswordLength: newPassword?.length });

  if (!token || !newPassword) {
    return sendResponse(res, 400, false, null, 'Token and new password are required');
  }
  if (newPassword.length < 6) {
    return sendResponse(res, 400, false, null, 'New password must be at least 6 characters');
  }

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?', [token]);
    const tokenRecord = (rows as any[])[0];
    if (!tokenRecord) {
      console.log('Token not found:', token);
      return sendResponse(res, 400, false, null, 'Invalid token');
    }

    if (tokenRecord.used) {
      console.log('Token already used:', token);
      return sendResponse(res, 400, false, null, 'Token is used or expired');
    }

    if (new Date() > new Date(tokenRecord.expires_at)) {
      console.log('Token expired:', { token, expires_at: tokenRecord.expires_at });
      return sendResponse(res, 400, false, null, 'Token is used or expired');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; purpose: string };
      if (decoded.purpose !== 'password_reset' || decoded.userId !== tokenRecord.user_id) {
        console.log('Invalid token payload:', decoded);
        return sendResponse(res, 400, false, null, 'Invalid token');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return sendResponse(res, 400, false, null, 'Invalid token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, tokenRecord.user_id]);
    await db.query('UPDATE password_reset_tokens SET used = ? WHERE token = ?', [true, token]);

    console.log('Password reset successful:', { user_id: tokenRecord.user_id });
    sendResponse(res, 200, true, { message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

// Socket.IO Authentication and Events
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('Socket.IO authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const user = socket.data.user;
  console.log(`User ${user.username} connected via Socket.IO`);

  try {
    const db = await initDb();
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT family_id FROM family_member WHERE user_id = ?', [user.userId]);
    const family = rows[0] as { family_id: number } | undefined;
    if (!family) {
      socket.emit('error', 'User not in a family');
      socket.disconnect();
      return;
    }

    socket.join(`family_${family.family_id}`);
    console.log(`User ${user.username} joined family_${family.family_id}`);

    const [messages] = await db.query<mysql.RowDataPacket[]>(
      'SELECT m.id, m.content, m.sent_at, m.sender_id, u.username AS sender_username ' +
      'FROM message m JOIN user u ON m.sender_id = u.id WHERE m.family_id = ? ORDER BY m.sent_at ASC',
      [family.family_id]
    );
    socket.emit('load_messages', messages);

    socket.to(`family_${family.family_id}`).emit('user_joined', `${user.username} 已加入聊天`);

    socket.on('message', async (message) => {
      try {
        const sent_at = toMysqlDatetime();
        const [result] = await db.query<mysql.ResultSetHeader>(
          'INSERT INTO message (family_id, sender_id, content, sent_at) VALUES (?, ?, ?, ?)',
          [family.family_id, user.userId, message.content, sent_at]
        );
        const savedMessage = {
          id: result.insertId,
          content: message.content,
          sent_at,
          sender_id: user.userId,
          sender_username: user.username,
        };
        io.to(`family_${family.family_id}`).emit('message', savedMessage);
        console.log('Message broadcasted:', savedMessage);
      } catch (error) {
        console.error('Socket.IO message error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user.username} disconnected`);
      socket.to(`family_${family.family_id}`).emit('user_left', `${user.username} 已離開聊天`);
    });
  } catch (error) {
    console.error('Socket.IO connection error:', error);
    socket.emit('error', 'Server error');
    socket.disconnect();
  }
});

// REST API Routes
app.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await initDb();
    await db.query('SELECT 1');
    sendResponse(res, 200, true, { status: 'healthy' });
  } catch (error) {
    console.error('Health check error:', error);
    sendResponse(res, 500, false, null, 'Database unavailable');
  }
});

app.get('/', async (req: Request, res: Response) => {
  console.log('Root route accessed');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided, serving login.html');
    return res.sendFile(path.join(__dirname, '../public', 'login.html'), (err) => {
      if (err) {
        console.error('Error serving login.html:', err);
        sendResponse(res, 500, false, null, 'Failed to load page');
      }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    console.log(`User ${decoded.username} authenticated, serving family.html`);
    return res.sendFile(path.join(__dirname, '../public', 'family.html'), (err) => {
      if (err) {
        console.error('Error serving family.html:', err);
        sendResponse(res, 500, false, null, 'Failed to load page');
      }
    });
  } catch (error) {
    console.error('Token verification error, serving login.html:', error);
    res.sendFile(path.join(__dirname, '../public', 'login.html'), (err) => {
      if (err) {
        console.error('Error serving login.html:', err);
        sendResponse(res, 500, false, null, 'Failed to load page');
      }
    });
  }
});

app.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  console.log('Registration attempt:', { username });

  if (!username || !password) {
    return sendResponse(res, 400, false, null, 'Username and password are required');
  }
  if (username.length < 3 || username.length > 32) {
    return sendResponse(res, 400, false, null, 'Username must be between 3 and 32 characters');
  }
  if (password.length < 6) {
    return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendResponse(res, 400, false, null, 'Invalid email format');
  }

  try {
    const db = await initDb();
    const [existingUser] = await db.query('SELECT id FROM user WHERE username = ? OR email = ?', [username, email || null]);
    if ((existingUser as any[]).length > 0) {
      return sendResponse(res, 409, false, null, 'Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO user (username, password, avatar, email) VALUES (?, ?, NULL, ?)',
      [username, hashedPassword, email || null]
    );
    console.log('Registration successful:', { username });
    sendResponse(res, 201, true, { message: 'Registration successful' });
  } catch (error) {
    console.error('Register error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });
  if (!username || !password) {
    return sendResponse(res, 400, false, null, 'Username and password are required');
  }
  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT id, username, password FROM user WHERE username = ?', [username]);
    const user = (rows as any[])[0];
    if (!user) {
      return sendResponse(res, 401, false, null, 'Invalid username');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, null, 'Invalid password');
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful:', { user_id: user.id });
    sendResponse(res, 200, true, { token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  console.log('Logout requested');
  sendResponse(res, 200, true, { message: 'Logout successful' });
});

app.get('/user', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT id, username, email, avatar FROM user WHERE id = ?', [user_id]);
    const user = (rows as any[])[0];
    if (!user) {
      return sendResponse(res, 400, false, null, 'User not found');
    }
    sendResponse(res, 200, true, { user_id: user.id, username: user.username, email: user.email, avatar: user.avatar });
  } catch (error) {
    console.error('User fetch error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.patch('/user/email', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const { email } = req.body;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendResponse(res, 400, false, null, 'Invalid email format');
  }

  try {
    const db = await initDb();
    const [existingEmail] = await db.query('SELECT id FROM user WHERE email = ? AND id != ?', [email, user_id]);
    if ((existingEmail as any[]).length > 0) {
      return sendResponse(res, 409, false, null, 'Email already in use');
    }

    await db.query('UPDATE user SET email = ? WHERE id = ?', [email || null, user_id]);
    console.log('Email updated:', { user_id, email });
    sendResponse(res, 200, true, { message: 'Email updated successfully' });
  } catch (error) {
    console.error('Update email error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/family', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const { name } = req.body;

  if (!name || name.length > 100) {
    return sendResponse(res, 400, false, null, 'Family name is required and must be 100 characters or less');
  }

  try {
    const db = await initDb();
    await db.query('START TRANSACTION');
    try {
      const [existingFamily] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
      console.log('Checked existing family for user:', { user_id, existingFamily });
      if ((existingFamily as any[]).length > 0) {
        throw new Error('User is already in a family');
      }

      const [result] = await db.query('INSERT INTO family (name, owner_id) VALUES (?, ?)', [name, user_id]);
      const family_id = (result as any).insertId;
      await db.query('INSERT INTO family_member (family_id, user_id, role) VALUES (?, ?, ?)', [family_id, user_id, 'admin']);
      await db.query('COMMIT');
      console.log('Family created:', { family_id, name, owner_id: user_id });
      sendResponse(res, 201, true, { message: 'Family created', family_id });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error: unknown) {
    console.error('Create family error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendResponse(res, message === 'User is already in a family' ? 403 : 500, false, null, message);
  }
});

app.post('/family/join', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const { family_id } = req.body;

  if (!family_id) {
    return sendResponse(res, 400, false, null, 'Family ID is required');
  }

  try {
    const db = await initDb();
    await db.query('START TRANSACTION');
    try {
      const [family] = await db.query('SELECT id FROM family WHERE id = ?', [family_id]);
      if ((family as any[]).length === 0) {
        throw new Error('Family not found');
      }

      const [existingFamily] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
      console.log('Checked existing family for join:', { user_id, existingFamily });
      if ((existingFamily as any[]).length > 0) {
        throw new Error('User is already in a family');
      }

      await db.query('INSERT INTO family_member (family_id, user_id, role) VALUES (?, ?, ?)', [family_id, user_id, 'member']);
      await db.query('COMMIT');
      console.log('User joined family:', { user_id, family_id });
      sendResponse(res, 200, true, { message: 'Joined family' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error: unknown) {
    console.error('Join family error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendResponse(res, 
      message === 'Family not found' ? 404 : 
      message === 'User is already in a family' ? 403 : 500, 
      false, null, message);
  }
});

app.get('/my-families', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  try {
    const db = await initDb();
    const [families] = await db.query(
      `SELECT f.id, f.name, f.owner_id, fm.role
       FROM family f
       JOIN family_member fm ON f.id = fm.family_id
       WHERE fm.user_id = ?`,
      [user_id]
    );
    console.log('Fetched families for user:', { user_id, families });
    sendResponse(res, 200, true, { families });
  } catch (error) {
    console.error('Fetch families error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.get('/family/members', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const family_id = req.query.family_id as string;

  if (!family_id) {
    return sendResponse(res, 400, false, null, 'Family ID is required');
  }

  try {
    const db = await initDb();
    const [isMember] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family_id, user_id]);
    if ((isMember as any[]).length === 0) {
      return sendResponse(res, 403, false, null, 'User is not a member of this family');
    }

    const [members] = await db.query(
      `SELECT u.id AS user_id, u.username
       FROM family_member fm
       JOIN user u ON fm.user_id = u.id
       WHERE fm.family_id = ?`,
      [family_id]
    );
    console.log('Fetched members for family:', { family_id, members });
    sendResponse(res, 200, true, { members });
  } catch (error) {
    console.error('Fetch family members error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.get('/calendar', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log(`User ${user_id} not in a family, returning 403`);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [events] = await db.query(
      'SELECT id, title, start_datetime, end_datetime, reminder_datetime, creator_id, notified FROM event WHERE family_id = ?',
      [family.family_id]
    );
    console.log('Fetched events for family:', { family_id: family.family_id, events });
    sendResponse(res, 200, true, { events });
  } catch (error) {
    console.error('Fetch calendar error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/calendar', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  let { title, start_datetime, end_datetime, reminder_datetime } = req.body;

  if (!title || !start_datetime) {
    return sendResponse(res, 400, false, null, 'Title and start date are required');
  }
  if (title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
  }

  // 修正：將 ISO 格式字串轉為 MySQL DATETIME 格式
  function fixDatetime(dt: string | undefined): string | null {
    if (!dt) return null;
    // 直接用 new Date 轉換
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;
    return toMysqlDatetime(d);
  }
  start_datetime = fixDatetime(start_datetime);
  end_datetime = fixDatetime(end_datetime);
  reminder_datetime = fixDatetime(reminder_datetime);

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const created_at = toMysqlDatetime();
    const [result] = await db.query(
      'INSERT INTO event (family_id, creator_id, title, start_datetime, end_datetime, reminder_datetime, created_at, notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [family.family_id, user_id, title, start_datetime, end_datetime, reminder_datetime, created_at, false]
    );
    console.log('Event created:', { event_id: (result as any).insertId, family_id: family.family_id });
    sendResponse(res, 201, true, { message: 'Event created', event_id: (result as any).insertId });
  } catch (error) {
    console.error('Create event error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.patch('/calendar/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const event_id = parseInt(req.params.id);
  let { title, start_datetime, end_datetime, reminder_datetime } = req.body;

  if (title && title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
  }

  // 修正：將 ISO 格式字串轉為 MySQL DATETIME 格式
  function fixDatetime(dt: string | undefined): string | null {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;
    return toMysqlDatetime(d);
  }
  start_datetime = fixDatetime(start_datetime);
  end_datetime = fixDatetime(end_datetime);
  reminder_datetime = fixDatetime(reminder_datetime);

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [event] = await db.query('SELECT id, creator_id FROM event WHERE id = ? AND family_id = ?', [event_id, family.family_id]);
    if ((event as any[]).length === 0) {
      return sendResponse(res, 404, false, null, 'Event not found');
    }

    // Restrict updates to event creator or family admin
    const eventData = (event as any[])[0];
    const [isAdmin] = await db.query('SELECT role FROM family_member WHERE user_id = ? AND family_id = ?', [user_id, family.family_id]);
    const isAdminRole = (isAdmin as any[])[0]?.role === 'admin';
    if (eventData.creator_id !== user_id && !isAdminRole) {
      return sendResponse(res, 403, false, null, 'Only the event creator or family admin can update this event');
    }

    const updates: { [key: string]: any } = {};
    if (title) updates.title = title;
    if (start_datetime !== undefined) updates.start_datetime = start_datetime;
    if (end_datetime !== undefined) updates.end_datetime = end_datetime;
    if (reminder_datetime !== undefined) updates.reminder_datetime = reminder_datetime;
    if (reminder_datetime !== undefined) updates.notified = false; // Reset notified flag if reminder changes

    if (Object.keys(updates).length === 0) {
      return sendResponse(res, 400, false, null, 'No fields to update');
    }

    const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), event_id];
    await db.query(`UPDATE event SET ${setClause} WHERE id = ?`, values);
    console.log('Event updated:', { event_id, updates });
    sendResponse(res, 200, true, { message: 'Event updated' });
  } catch (error) {
    console.error('Update event error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.delete('/calendar/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const event_id = parseInt(req.params.id);

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [event] = await db.query('SELECT id, creator_id FROM event WHERE id = ? AND family_id = ?', [event_id, family.family_id]);
    if ((event as any[]).length === 0) {
      return sendResponse(res, 404, false, null, 'Event not found');
    }

    // Restrict deletion to event creator or family admin
    const eventData = (event as any[])[0];
    const [isAdmin] = await db.query('SELECT role FROM family_member WHERE user_id = ? AND family_id = ?', [user_id, family.family_id]);
    const isAdminRole = (isAdmin as any[])[0]?.role === 'admin';
    if (eventData.creator_id !== user_id && !isAdminRole) {
      return sendResponse(res, 403, false, null, 'Only the event creator or family admin can delete this event');
    }

    await db.query('DELETE FROM event WHERE id = ?', [event_id]);
    console.log('Event deleted:', { event_id });
    sendResponse(res, 200, true, { message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.get('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const query = (req.query.q as string)?.trim() || '';
  const sort = req.query.sort as string;

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    let sql = 
      'SELECT t.id, t.title, t.description, t.due_date, t.priority, t.status, t.creator_id, t.assignee_id, u.username AS assignee_username' +
      ' FROM task t LEFT JOIN user u ON t.assignee_id = u.id WHERE t.family_id = ?';
    const params = [family.family_id];

    if (query) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    if (sort) {
      const sortMap: { [key: string]: string } = {
        'due_date_asc': 'due_date ASC',
        'due_date_desc': 'due_date DESC',
        'priority_asc': "CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END ASC",
        'priority_desc': "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END DESC",
      };
      if (sortMap[sort]) {
        sql += ` ORDER BY ${sortMap[sort]}`;
      }
    }

    const [tasks] = await db.query(sql, params);
    console.log('Fetched tasks:', { family_id: family.family_id, tasks });
    sendResponse(res, 200, true, { tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const { title, description, assignee_id, due_date, priority } = req.body;

  if (!title || typeof title !== 'string' || title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title is required and must be a string (max 100 characters)');
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return sendResponse(res, 400, false, null, 'Priority must be low, medium, or high');
  }

  try {
    const db = await initDb();
    await db.query('START TRANSACTION');
    try {
      const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
      const family = (rows as any[])[0];
      if (!family) {
        console.log('User not in a family:', user_id);
        throw new Error('User not in a family');
      }

      if (assignee_id) {
        const [exists] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family.family_id, assignee_id]);
        if ((exists as any[]).length === 0) {
          throw new Error('Assignee must be a family member');
        }
      }

      const created_at = toMysqlDatetime();
      console.log('Inserting task:', { family_id: family.family_id, creator_id: user_id, assignee_id, title, description, due_date, priority, created_at });
      const [result] = await db.query(
        'INSERT INTO task (family_id, creator_id, assignee_id, title, description, due_date, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [family.family_id, user_id, assignee_id || null, title, description || null, due_date || null, priority || 'medium', 'pending', created_at]
      );
      await db.query('COMMIT');
      console.log('Task created:', { task_id: (result as any).insertId, family_id: family.family_id, title });
      sendResponse(res, 201, true, { message: 'Task created', task_id: (result as any).insertId });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error: unknown) {
    console.error('Create task error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendResponse(res, 
      message === 'User not in a family' ? 403 : 
      message === 'Assignee must be a family member' ? 400 : 500, 
      false, null, message);
  }
});

app.patch('/tasks/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const task_id = parseInt(req.params.id);
  const { title, description, assignee_id, due_date, priority, status } = req.body;

  if (title && typeof title !== 'string' || title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title must be a string (max 100 characters)');
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return sendResponse(res, 400, false, null, 'Priority must be low, medium, or high');
  }
  if (status && !['pending', 'completed'].includes(status)) {
    return sendResponse(res, 400, false, null, 'Status must be pending or completed');
  }

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [task] = await db.query('SELECT id FROM task WHERE id = ? AND family_id = ?', [task_id, family.family_id]);
    if ((task as any[]).length === 0) {
      return sendResponse(res, 404, false, null, 'Task not found');
    }

    if (assignee_id) {
      const [exists] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family.family_id, assignee_id]);
      if ((exists as any[]).length === 0) {
        return sendResponse(res, 400, false, null, 'Assignee must be a family member');
      }
    }

    const updates: { [key: string]: any } = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description || null;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id || null;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return sendResponse(res, 400, false, null, 'No fields to update');
    }

    const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), task_id];
    console.log('Updating task:', { task_id, updates });
    await db.query(`UPDATE task SET ${setClause} WHERE id = ?`, values);
    console.log('Task updated:', { task_id, updates });
    sendResponse(res, 200, true, { message: 'Task updated' });
  } catch (error) {
    console.error('Update task error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.delete('/tasks/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const task_id = parseInt(req.params.id);

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [task] = await db.query('SELECT id FROM task WHERE id = ? AND family_id = ?', [task_id, family.family_id]);
    if ((task as any[]).length === 0) {
      return sendResponse(res, 404, false, null, 'Task not found');
    }

    await db.query('DELETE FROM task WHERE id = ?', [task_id]);
    console.log('Task deleted:', { task_id });
    sendResponse(res, 200, true, { message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.get('/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const [messages] = await db.query(
      'SELECT m.id, m.content, m.sent_at, m.sender_id, u.username AS sender_username ' +
      'FROM message m JOIN user u ON m.sender_id = u.id WHERE m.family_id = ? ORDER BY m.sent_at ASC',
      [family.family_id]
    );
    console.log('Fetched messages:', { family_id: family.family_id, messages });
    sendResponse(res, 200, true, { messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

app.post('/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.length > 1000) {
    return sendResponse(res, 400, false, null, 'Content is required and must be a string (max 1000 characters)');
  }

  try {
    const db = await initDb();
    const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
    const family = (rows as any[])[0];
    if (!family) {
      console.log('User not in a family:', user_id);
      return sendResponse(res, 403, false, null, 'User not in a family');
    }

    const sent_at = toMysqlDatetime();
    console.log('Inserting message:', { family_id: family.family_id, sender_id: user_id, content, sent_at });
    const [result] = await db.query(
      'INSERT INTO message (family_id, sender_id, content, sent_at) VALUES (?, ?, ?, ?)',
      [family.family_id, user_id, content, sent_at]
    );
    console.log('Message sent:', { message_id: (result as any).insertId, family_id: family.family_id });
    sendResponse(res, 201, true, { message: 'Message sent', message_id: (result as any).insertId });
  } catch (error) {
    console.error('Create message error:', error);
    sendResponse(res, 500, false, null, 'Server error');
  }
});

async function startServer() {
  try {
    await initDb();
    // Start periodic notification check
    setInterval(checkAndSendNotifications, 60 * 1000); // Run every minute
    httpServer.listen(PORT, () => {
      print(PORT);
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

