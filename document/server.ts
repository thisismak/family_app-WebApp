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

// 備注：載入環境變數，配置伺服器和資料庫連線
dotenv.config();

// 備注：設置 VAPID 用於 Web Push 通知，與 index.html 和 login.html 的 Service Worker 相關
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// 備注：格式化日期為 MySQL DATETIME 格式，用於資料庫操作
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
// 備注：設置 Socket.IO 伺服器，支援即時聊天功能，與 index.html 的聊天導航相關
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
// 備注：設置靜態檔案服務，服務 public 目錄下的檔案，如 index.html 和 login.html
app.use(express.static(path.join(__dirname, '../public'), {
  index: false,
  setHeaders: (res, filePath) => {
    console.log(`Serving static file: ${filePath}`);
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// 備注：初始化 MySQL 資料庫連線，創建和管理資料表結構
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
      charset: 'utf8mb4', // 備注：使用 utf8mb4 字符集支援多語言
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL connected with charset: utf8mb4');

    // 備注：確保資料庫和表使用 utf8mb4 字符集
    await db.query('ALTER DATABASE family_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('Database character set set to utf8mb4');

    // 備注：創建用戶表，儲存用戶資訊，與 /register 和 /login 路由相關
    await db.query(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 備注：創建家庭表，儲存家庭資訊，與 /family 路由相關
    await db.query(`
      CREATE TABLE IF NOT EXISTS family (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        owner_id INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 備注：創建家庭成員表，管理成員角色，與 /family/join 路由相關
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

    // 備注：創建事件表，儲存日曆事件，與 /calendar 路由相關
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

    // 備注：遷移事件表，添加 notified 欄位以追蹤通知狀態
    const [eventColumns] = await db.query('SHOW COLUMNS FROM event LIKE "notified"');
    if ((eventColumns as any[]).length === 0) {
      await db.query('ALTER TABLE event ADD COLUMN notified BOOLEAN DEFAULT FALSE');
      console.log('Added notified column to event table');
    }

    // 備注：創建推送訂閱表，儲存 Web Push 通知的訂閱資訊，與 /subscribe 路由相關
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

    // 備注：創建任務表，儲存家庭任務，與 /tasks 路由相關
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

    // 備注：創建訊息表，儲存聊天訊息，與 Socket.IO 和 /messages 路由相關
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

    // 備注：創建密碼重設令牌表，支援忘記密碼功能，與 /forgot-password 和 /reset-password 路由相關
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

    // 備注：遷移所有表到 utf8mb4 字符集，確保多語言支援
    const tables = ['user', 'family', 'family_member', 'event', 'push_subscriptions', 'task', 'message', 'password_reset_tokens'];
    for (const table of tables) {
      const [tableStatus] = await db.query(`SHOW TABLE STATUS WHERE Name = ?`, [table]);
      if ((tableStatus as any[])[0].Collation !== 'utf8mb4_unicode_ci') {
        await db.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Converted table ${table} to utf8mb4_unicode_ci`);
      }
    }

    // 備注：修正特定欄位的字符集，確保一致性
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

// 備注：身份驗證中間件，檢查 JWT token，應用於需要身份驗證的路由
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

// 備注：標準化 API 回應格式的輔助函數
const sendResponse = (res: Response, status: number, success: boolean, data?: any, error?: string) => {
  res.status(status).json({ success, data, error });
};

// 備注：將 exec 轉為 Promise 形式，支援異步執行外部命令
const execPromise = promisify(exec);

// 備注：處理推送通知訂閱，儲存用戶的 Web Push 訂閱資訊
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

    // 備注：檢查是否已有訂閱，存在則更新，否則新增
    const [existing] = await db.query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND family_id = ?',
      [user_id, family.family_id]
    );
    if ((existing as any[]).length > 0) {
      await db.query(
        'UPDATE push_subscriptions SET subscription = ?, created_at = ? WHERE user_id = ? AND family_id = ?',
        [JSON.stringify(subscription), toMysqlDatetime(), user_id, family.family_id]
      );
    } else {
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

// 備注：檢查並發送事件提醒通知，與 event 表的 notified 欄位和 push_subscriptions 表相關
async function checkAndSendNotifications() {
  try {
    const db = await initDb();
    const [events] = await db.query(
      'SELECT e.id, e.title, e.reminder_datetime, e.family_id, u.username AS creator_username ' +
      'FROM event e JOIN user u ON e.creator_id = u.id ' +
      'WHERE e.reminder_datetime <= NOW() AND e.notified = FALSE'
    );

    for (const event of events as any[]) {
      const [subscriptions] = await db.query(
        'SELECT subscription FROM push_subscriptions WHERE family_id = ?',
        [event.family_id]
      );

      const payload = {
        title: `🔔Get Ready for ${event.title}!🔔`,
        body: `🎉Your fun event "${event.title}" starts at ${new Date(event.reminder_datetime).toLocaleTimeString()}!🎉`
      };

      for (const sub of subscriptions as any[]) {
        try {
          await webPush.sendNotification(JSON.parse(sub.subscription), JSON.stringify(payload));
          console.log(`Notification sent for event ${event.id} to subscription`);
        } catch (error) {
          console.error(`Failed to send notification for event ${event.id}:`, error);
        }
      }

      await db.query('UPDATE event SET notified = TRUE WHERE id = ?', [event.id]);
      console.log(`Event ${event.id} marked as notified`);
    }
  } catch (error) {
    console.error('Notification check failed:', error);
  }
}

// 備注：忘記密碼路由，生成重設令牌並發送郵件，與 /reset-password 路由相關
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

// 備注：重設密碼路由，驗證令牌並更新密碼，與 /forgot-password 路由相關
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

// 備注：Socket.IO 身份驗證，確保聊天功能的安全性
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

// 備注：處理 Socket.IO 連線，支援即時聊天功能
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

// 備注：健康檢查路由，確認伺服器和資料庫狀態
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

// 備注：根路由，根據身份驗證狀態提供 index.html 或 login.html
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

// 備注：用戶註冊路由，處理新用戶創建，與 login.html 的註冊鏈接相關
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

// 備注：用戶登入路由，驗證用戶憑證並生成 JWT token，與 login.html 的表單提交相關
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

// 備注：登出路由，清除客戶端 token，與 index.html 的登出功能相關
app.post('/logout', (req: Request, res: Response) => {
  console.log('Logout requested');
  sendResponse(res, 200, true, { message: 'Logout successful' });
});

// 備注：獲取用戶資訊路由，與 index.html 的 fetchUser 函數相關
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

// 備注：更新用戶電子郵件路由，支援用戶修改個人資訊
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

// 備注：創建家庭路由，允許用戶創建新家庭，與 family_member 表相關
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

// 備注：加入家庭路由，允許用戶加入現有家庭，與 family_member 表相關
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

// 備注：獲取用戶的家庭列表路由，與 index.html 的家庭管理功能相關
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

// 備注：獲取家庭成員列表路由，與 index.html 的家庭管理功能相關
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

// 備注：獲取日曆事件路由，與 index.html 的日曆導航相關
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

// 備注：創建日曆事件路由，與 index.html 的日曆添加功能相關
app.post('/calendar', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  let { title, start_datetime, end_datetime, reminder_datetime } = req.body;

  if (!title || !start_datetime) {
    return sendResponse(res, 400, false, null, 'Title and start date are required');
  }
  if (title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
  }

  // 備注：修正日期格式，確保與 MySQL 相容
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

// 備注：更新日曆事件路由，限制為創建者或管理員
app.patch('/calendar/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.userId;
  const event_id = parseInt(req.params.id);
  let { title, start_datetime, end_datetime, reminder_datetime } = req.body;

  if (title && title.length > 100) {
    return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
  }

  // 備注：修正日期格式，確保與 MySQL 相容
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

// 備注：刪除日曆事件路由，限制為創建者或管理員
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

// 備注：獲取任務列表路由，支援搜尋和排序，與 index.html 的任務管理功能相關
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

// 備注：創建任務路由，與 index.html 的任務添加功能相關
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

// 備注：更新任務路由，支援修改任務屬性
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

// 備注：刪除任務路由，與 index.html 的任務管理功能相關
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

// 備注：獲取聊天訊息路由，與 index.html 的聊天功能相關
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

// 備注：發送聊天訊息路由，與 index.html 的聊天功能和 Socket.IO 相關
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

// 備注：啟動伺服器，初始化資料庫並開始週期性通知檢查
async function startServer() {
  try {
    await initDb();
    // 備注：每分鐘檢查一次事件通知
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