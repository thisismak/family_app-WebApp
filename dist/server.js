"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const listening_on_1 = require("listening-on");
const promise_1 = __importDefault(require("mysql2/promise"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
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
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public'), {
    index: false,
    setHeaders: (res, filePath) => {
        console.log(`Serving static file: ${filePath}`);
    }
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json({ limit: '10mb' }));
let db = null;
async function initDb() {
    if (db)
        return db;
    try {
        db = await promise_1.default.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'app_user',
            password: process.env.DB_PASSWORD || 'your_secure_password',
            database: process.env.DB_NAME || 'family_app',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('MySQL connected');
        // Create tables one by one to ensure correct order for foreign key dependencies
        await db.query(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(32) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        email VARCHAR(255) UNIQUE
      )
    `);
        await db.query(`
      CREATE TABLE IF NOT EXISTS family (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        owner_id INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
        await db.query(`
      CREATE TABLE IF NOT EXISTS family_member (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
        await db.query(`
      CREATE TABLE IF NOT EXISTS event (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        title VARCHAR(100) NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME,
        reminder_datetime DATETIME,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
        await db.query(`
      CREATE TABLE IF NOT EXISTS task (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        assignee_id INTEGER,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        due_date DATE,
        priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES user(id) ON DELETE SET NULL
      )
    `);
        await db.query(`
      CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        family_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content VARCHAR(1000) NOT NULL,
        sent_at DATETIME NOT NULL,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
        console.log('All tables created successfully');
        return db;
    }
    catch (error) {
        console.error('MySQL initialization error:', error);
        throw error;
    }
}
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
const sendResponse = (res, status, success, data, error) => {
    res.status(status).json({ success, data, error });
};
// Socket.IO Authentication and Events
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        socket.data.user = decoded;
        next();
    }
    catch (error) {
        console.error('Socket.IO authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
});
io.on('connection', async (socket) => {
    const user = socket.data.user;
    console.log(`User ${user.username} connected via Socket.IO`);
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user.userId]);
        const family = rows[0];
        if (!family) {
            socket.emit('error', 'User not in a family');
            socket.disconnect();
            return;
        }
        socket.join(`family_${family.family_id}`);
        console.log(`User ${user.username} joined family_${family.family_id}`);
        const [messages] = await db.query('SELECT m.id, m.content, m.sent_at, m.sender_id, u.username AS sender_username ' +
            'FROM message m JOIN user u ON m.sender_id = u.id WHERE m.family_id = ? ORDER BY m.sent_at ASC', [family.family_id]);
        socket.emit('load_messages', messages);
        socket.to(`family_${family.family_id}`).emit('user_joined', `${user.username} 已加入聊天`);
        socket.on('message', async (message) => {
            try {
                const sent_at = new Date().toISOString();
                const [result] = await db.query('INSERT INTO message (family_id, sender_id, content, sent_at) VALUES (?, ?, ?, ?)', [family.family_id, user.userId, message.content, sent_at]);
                const savedMessage = {
                    id: result.insertId,
                    content: message.content,
                    sent_at,
                    sender_id: user.userId,
                    sender_username: user.username,
                };
                io.to(`family_${family.family_id}`).emit('message', savedMessage);
                console.log('Message broadcasted:', savedMessage);
            }
            catch (error) {
                console.error('Socket.IO message error:', error);
                socket.emit('error', 'Failed to send message');
            }
        });
        socket.on('disconnect', () => {
            console.log(`User ${user.username} disconnected`);
            socket.to(`family_${family.family_id}`).emit('user_left', `${user.username} 已離開聊天`);
        });
    }
    catch (error) {
        console.error('Socket.IO connection error:', error);
        socket.emit('error', 'Server error');
        socket.disconnect();
    }
});
// REST API Routes
app.get('/health', async (req, res) => {
    try {
        const db = await initDb();
        await db.query('SELECT 1');
        sendResponse(res, 200, true, { status: 'healthy' });
    }
    catch (error) {
        console.error('Health check error:', error);
        sendResponse(res, 500, false, null, 'Database unavailable');
    }
});
app.get('/', async (req, res) => {
    console.log('Root route accessed');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided, serving login.html');
        return res.sendFile(path_1.default.join(__dirname, '../public', 'login.html'), (err) => {
            if (err) {
                console.error('Error serving login.html:', err);
                sendResponse(res, 500, false, null, 'Failed to load page');
            }
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log(`User ${decoded.username} authenticated, serving family.html`);
        return res.sendFile(path_1.default.join(__dirname, '../public', 'family.html'), (err) => {
            if (err) {
                console.error('Error serving family.html:', err);
                sendResponse(res, 500, false, null, 'Failed to load page');
            }
        });
    }
    catch (error) {
        console.error('Token verification error, serving login.html:', error);
        res.sendFile(path_1.default.join(__dirname, '../public', 'login.html'), (err) => {
            if (err) {
                console.error('Error serving login.html:', err);
                sendResponse(res, 500, false, null, 'Failed to load page');
            }
        });
    }
});
app.post('/register', async (req, res) => {
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
        if (existingUser.length > 0) {
            return sendResponse(res, 409, false, null, 'Username or email already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db.query('INSERT INTO user (username, password, avatar, email) VALUES (?, ?, NULL, ?)', [username, hashedPassword, email || null]);
        console.log('Registration successful:', { username });
        sendResponse(res, 201, true, { message: 'Registration successful' });
    }
    catch (error) {
        console.error('Register error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });
    if (!username || !password) {
        return sendResponse(res, 400, false, null, 'Username and password are required');
    }
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT id, username, password FROM user WHERE username = ?', [username]);
        const user = rows[0];
        if (!user) {
            return sendResponse(res, 401, false, null, 'Invalid username');
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, 401, false, null, 'Invalid password');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful:', { user_id: user.id });
        sendResponse(res, 200, true, { token, message: 'Login successful' });
    }
    catch (error) {
        console.error('Login error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/logout', (req, res) => {
    console.log('Logout requested');
    sendResponse(res, 200, true, { message: 'Logout successful' });
});
app.get('/user', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT id, username, email, avatar FROM user WHERE id = ?', [user_id]);
        const user = rows[0];
        if (!user) {
            return sendResponse(res, 400, false, null, 'User not found');
        }
        sendResponse(res, 200, true, { user_id: user.id, username: user.username, email: user.email, avatar: user.avatar });
    }
    catch (error) {
        console.error('User fetch error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.patch('/user/email', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const { email } = req.body;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendResponse(res, 400, false, null, 'Invalid email format');
    }
    try {
        const db = await initDb();
        const [existingEmail] = await db.query('SELECT id FROM user WHERE email = ? AND id != ?', [email, user_id]);
        if (existingEmail.length > 0) {
            return sendResponse(res, 409, false, null, 'Email already in use');
        }
        await db.query('UPDATE user SET email = ? WHERE id = ?', [email || null, user_id]);
        console.log('Email updated:', { user_id, email });
        sendResponse(res, 200, true, { message: 'Email updated successfully' });
    }
    catch (error) {
        console.error('Update email error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/family', authenticate, async (req, res) => {
    const user_id = req.user.userId;
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
            if (existingFamily.length > 0) {
                throw new Error('User is already in a family');
            }
            const [result] = await db.query('INSERT INTO family (name, owner_id) VALUES (?, ?)', [name, user_id]);
            const family_id = result.insertId;
            await db.query('INSERT INTO family_member (family_id, user_id, role) VALUES (?, ?, ?)', [family_id, user_id, 'admin']);
            await db.query('COMMIT');
            console.log('Family created:', { family_id, name, owner_id: user_id });
            sendResponse(res, 201, true, { message: 'Family created', family_id });
        }
        catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Create family error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        sendResponse(res, message === 'User is already in a family' ? 403 : 500, false, null, message);
    }
});
app.post('/family/join', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const { family_id } = req.body;
    if (!family_id) {
        return sendResponse(res, 400, false, null, 'Family ID is required');
    }
    try {
        const db = await initDb();
        await db.query('START TRANSACTION');
        try {
            const [family] = await db.query('SELECT id FROM family WHERE id = ?', [family_id]);
            if (family.length === 0) {
                throw new Error('Family not found');
            }
            const [existingFamily] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
            console.log('Checked existing family for join:', { user_id, existingFamily });
            if (existingFamily.length > 0) {
                throw new Error('User is already in a family');
            }
            await db.query('INSERT INTO family_member (family_id, user_id, role) VALUES (?, ?, ?)', [family_id, user_id, 'member']);
            await db.query('COMMIT');
            console.log('User joined family:', { user_id, family_id });
            sendResponse(res, 200, true, { message: 'Joined family' });
        }
        catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Join family error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        sendResponse(res, message === 'Family not found' ? 404 :
            message === 'User is already in a family' ? 403 : 500, false, null, message);
    }
});
app.get('/my-families', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    try {
        const db = await initDb();
        const [families] = await db.query(`SELECT f.id, f.name, f.owner_id, fm.role
       FROM family f
       JOIN family_member fm ON f.id = fm.family_id
       WHERE fm.user_id = ?`, [user_id]);
        console.log('Fetched families for user:', { user_id, families });
        sendResponse(res, 200, true, { families });
    }
    catch (error) {
        console.error('Fetch families error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.get('/family/members', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const family_id = req.query.family_id;
    if (!family_id) {
        return sendResponse(res, 400, false, null, 'Family ID is required');
    }
    try {
        const db = await initDb();
        const [isMember] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family_id, user_id]);
        if (isMember.length === 0) {
            return sendResponse(res, 403, false, null, 'User is not a member of this family');
        }
        const [members] = await db.query(`SELECT u.id AS user_id, u.username
       FROM family_member fm
       JOIN user u ON fm.user_id = u.id
       WHERE fm.family_id = ?`, [family_id]);
        console.log('Fetched members for family:', { family_id, members });
        sendResponse(res, 200, true, { members });
    }
    catch (error) {
        console.error('Fetch family members error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.get('/calendar', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log(`User ${user_id} not in a family, returning 403`);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const [events] = await db.query('SELECT id, title, start_datetime, end_datetime, reminder_datetime, creator_id FROM event WHERE family_id = ?', [family.family_id]);
        console.log('Fetched events for family:', { family_id: family.family_id, events });
        sendResponse(res, 200, true, { events });
    }
    catch (error) {
        console.error('Fetch calendar error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/calendar', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const { title, start_datetime, end_datetime, reminder_datetime } = req.body;
    if (!title || !start_datetime) {
        return sendResponse(res, 400, false, null, 'Title and start date are required');
    }
    if (title.length > 100) {
        return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
    }
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const created_at = new Date().toISOString();
        const [result] = await db.query('INSERT INTO event (family_id, creator_id, title, start_datetime, end_datetime, reminder_datetime, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [family.family_id, user_id, title, start_datetime, end_datetime || null, reminder_datetime || null, created_at]);
        console.log('Event created:', { event_id: result.insertId, family_id: family.family_id });
        sendResponse(res, 201, true, { message: 'Event created', event_id: result.insertId });
    }
    catch (error) {
        console.error('Create event error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.get('/tasks', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const query = req.query.q?.trim() || '';
    const sort = req.query.sort;
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        let sql = 'SELECT t.id, t.title, t.description, t.due_date, t.priority, t.status, t.creator_id, t.assignee_id, u.username AS assignee_username' +
            ' FROM task t LEFT JOIN user u ON t.assignee_id = u.id WHERE t.family_id = ?';
        const params = [family.family_id];
        if (query) {
            sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        if (sort) {
            const sortMap = {
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
    }
    catch (error) {
        console.error('Fetch tasks error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/tasks', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const { title, description, assignee_id, due_date, priority } = req.body;
    if (!title || title.length > 100) {
        return sendResponse(res, 400, false, null, 'Title is required and must be 100 characters or less');
    }
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
        return sendResponse(res, 400, false, null, 'Priority must be low, medium, or high');
    }
    try {
        const db = await initDb();
        await db.query('START TRANSACTION');
        try {
            const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
            const family = rows[0];
            if (!family) {
                console.log('User not in a family:', user_id);
                throw new Error('User not in a family');
            }
            if (assignee_id) {
                const [exists] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family.family_id, assignee_id]);
                if (exists.length === 0) {
                    throw new Error('Assignee must be a family member');
                }
            }
            const created_at = new Date().toISOString();
            const [result] = await db.query('INSERT INTO task (family_id, creator_id, assignee_id, title, description, due_date, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [family.family_id, user_id, assignee_id || null, title, description || null, due_date || null, priority || 'medium', 'pending', created_at]);
            await db.query('COMMIT');
            console.log('Task created:', { task_id: result.insertId, family_id: family.family_id });
            sendResponse(res, 201, true, { message: 'Task created', task_id: result.insertId });
        }
        catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Create task error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        sendResponse(res, message === 'User not in a family' ? 403 :
            message === 'Assignee must be a family member' ? 400 : 500, false, null, message);
    }
});
app.patch('/tasks/:id', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const task_id = parseInt(req.params.id);
    const { title, description, assignee_id, due_date, priority, status } = req.body;
    if (title && title.length > 100) {
        return sendResponse(res, 400, false, null, 'Title must be 100 characters or less');
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
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const [task] = await db.query('SELECT id FROM task WHERE id = ? AND family_id = ?', [task_id, family.family_id]);
        if (task.length === 0) {
            return sendResponse(res, 404, false, null, 'Task not found');
        }
        if (assignee_id) {
            const [exists] = await db.query('SELECT user_id FROM family_member WHERE family_id = ? AND user_id = ?', [family.family_id, assignee_id]);
            if (exists.length === 0) {
                return sendResponse(res, 400, false, null, 'Assignee must be a family member');
            }
        }
        const updates = {};
        if (title)
            updates.title = title;
        if (description !== undefined)
            updates.description = description || null;
        if (assignee_id !== undefined)
            updates.assignee_id = assignee_id || null;
        if (due_date !== undefined)
            updates.due_date = due_date || null;
        if (priority)
            updates.priority = priority;
        if (status)
            updates.status = status;
        if (Object.keys(updates).length === 0) {
            return sendResponse(res, 400, false, null, 'No fields to update');
        }
        const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), task_id];
        await db.query(`UPDATE task SET ${setClause} WHERE id = ?`, values);
        console.log('Task updated:', { task_id, updates });
        sendResponse(res, 200, true, { message: 'Task updated' });
    }
    catch (error) {
        console.error('Update task error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.delete('/tasks/:id', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const task_id = parseInt(req.params.id);
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const [task] = await db.query('SELECT id FROM task WHERE id = ? AND family_id = ?', [task_id, family.family_id]);
        if (task.length === 0) {
            return sendResponse(res, 404, false, null, 'Task not found');
        }
        await db.query('DELETE FROM task WHERE id = ?', [task_id]);
        console.log('Task deleted:', { task_id });
        sendResponse(res, 200, true, { message: 'Task deleted' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.get('/messages', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const [messages] = await db.query('SELECT m.id, m.content, m.sent_at, m.sender_id, u.username AS sender_username ' +
            'FROM message m JOIN user u ON m.sender_id = u.id WHERE m.family_id = ? ORDER BY m.sent_at ASC', [family.family_id]);
        console.log('Fetched messages:', { family_id: family.family_id, messages });
        sendResponse(res, 200, true, { messages });
    }
    catch (error) {
        console.error('Fetch messages error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
app.post('/messages', authenticate, async (req, res) => {
    const user_id = req.user.userId;
    const { content } = req.body;
    if (!content || content.length > 1000) {
        return sendResponse(res, 400, false, null, 'Content is required and must be 1000 characters or less');
    }
    try {
        const db = await initDb();
        const [rows] = await db.query('SELECT family_id FROM family_member WHERE user_id = ?', [user_id]);
        const family = rows[0];
        if (!family) {
            console.log('User not in a family:', user_id);
            return sendResponse(res, 403, false, null, 'User not in a family');
        }
        const sent_at = new Date().toISOString();
        const [result] = await db.query('INSERT INTO message (family_id, sender_id, content, sent_at) VALUES (?, ?, ?, ?)', [family.family_id, user_id, content, sent_at]);
        console.log('Message sent:', { message_id: result.insertId, family_id: family.family_id });
        sendResponse(res, 201, true, { message: 'Message sent', message_id: result.insertId });
    }
    catch (error) {
        console.error('Create message error:', error);
        sendResponse(res, 500, false, null, 'Server error');
    }
});
async function startServer() {
    try {
        await initDb();
        httpServer.listen(PORT, () => {
            (0, listening_on_1.print)(PORT);
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
