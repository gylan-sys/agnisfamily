import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "family.db");
const JWT_SECRET = process.env.JWT_SECRET || "agnisfamily-secret-key-123";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize Database
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// Migration System
function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrations = [
    {
      name: "001_initial_schema",
      up: `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'member', -- 'admin' or 'member'
          background_url TEXT,
          profile_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL, -- 'income' or 'expense'
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT UNIQUE NOT NULL,
          limit_amount REAL NOT NULL,
          month TEXT NOT NULL, -- YYYY-MM
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bills (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          due_date TEXT NOT NULL,
          status TEXT DEFAULT 'unpaid', -- 'paid' or 'unpaid'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          due_date TEXT,
          status TEXT DEFAULT 'pending', -- 'pending', 'in-progress', 'completed'
          assigned_to INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS grocery_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item TEXT NOT NULL,
          status TEXT DEFAULT 'pending', -- 'pending', 'bought'
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS gallery_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `
    }
  ];

  for (const m of migrations) {
    const row = db.prepare("SELECT id FROM _migrations WHERE name = ?").get(m.name);
    if (!row) {
      console.log(`Executing migration: ${m.name}`);
      db.exec(m.up);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name);
    }
  }

  // Ensure primary admin exists
  const adminEmail = 'gkrismantara@gmail.com';
  const adminPassword = '$3cr3tagnis';
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)")
      .run(adminEmail, hashedPassword, 'Primary Admin', 'admin');
    console.log("Primary admin created.");
  }
}

migrate();

// Express App setup
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // File Upload Route
  app.post("/api/upload", authenticateToken, upload.single("file"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare(
        "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)"
      ).run(email, hashedPassword, name, role || 'member');
      res.json({ id: result.lastInsertRowid, message: "User registered" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, background_url: user.background_url } });
  });

  app.get("/api/user/profile", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, email, name, role, background_url, profile_url FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.put("/api/user/profile", authenticateToken, (req: any, res) => {
    const { name, background_url, profile_url } = req.body;
    db.prepare("UPDATE users SET name = ?, background_url = ?, profile_url = ? WHERE id = ?")
      .run(name, background_url, profile_url, req.user.id);
    res.json({ message: "Profile updated" });
  });

  // Financial Dashboard
  app.get("/api/transactions", authenticateToken, (req, res) => {
    const transactions = db.prepare("SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.date DESC").all();
    res.json(transactions);
  });

  app.post("/api/transactions", authenticateToken, (req: any, res) => {
    const { amount, type, category, date, description } = req.body;
    const result = db.prepare(
      "INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, amount, type, category, date, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", authenticateToken, (req: any, res) => {
    try {
      const txId = req.params.id;
      const tx: any = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId);
      if (tx && tx.description) {
        const match = tx.description.match(/\[Bill ID:\s*([0-9]+)\]/);
        if (match) {
          const billId = match[1];
          db.prepare("UPDATE bills SET status = 'unpaid' WHERE id = ?").run(billId);
        }
      }
      db.prepare("DELETE FROM transactions WHERE id = ?").run(txId);
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Budgets
  app.get("/api/budgets", authenticateToken, (req, res) => {
    const budgets = db.prepare("SELECT * FROM budgets").all();
    res.json(budgets);
  });

  app.post("/api/budgets", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Insufficient permissions" });
    const { category, limit_amount, month } = req.body;
    const result = db.prepare(
      "INSERT OR REPLACE INTO budgets (category, limit_amount, month) VALUES (?, ?, ?)"
    ).run(category, limit_amount, month);
    res.json({ id: result.lastInsertRowid });
  });

  // Bills
  app.get("/api/bills", authenticateToken, (req, res) => {
    const bills = db.prepare("SELECT * FROM bills ORDER BY due_date ASC").all();
    res.json(bills);
  });

  app.post("/api/bills", authenticateToken, (req, res) => {
    const { name, amount, due_date } = req.body;
    const result = db.prepare(
      "INSERT INTO bills (name, amount, due_date) VALUES (?, ?, ?)"
    ).run(name, amount, due_date);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/bills/:id/status", authenticateToken, (req: any, res) => {
    const { status } = req.body;
    const billId = req.params.id;

    try {
      const updateTransaction = db.transaction(() => {
        const bill: any = db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
        if (!bill) {
          throw new Error("Bill not found");
        }

        // Delete any existing transaction for this bill first
        db.prepare("DELETE FROM transactions WHERE description LIKE ?").run(`%[Bill ID: ${billId}]%`);

        // Update the status on the bill
        db.prepare("UPDATE bills SET status = ? WHERE id = ?").run(status, billId);

        // If newly marked as paid, create an expense transaction
        if (status === "paid") {
          db.prepare(
            "INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, 'expense', 'Bills', ?, ?)"
          ).run(
            req.user.id,
            bill.amount,
            new Date().toISOString().split("T")[0],
            `Pembayaran Tagihan: ${bill.name} [Bill ID: ${billId}]`
          );
        }
      });

      updateTransaction();
      res.json({ message: "Status updated" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tasks
  app.get("/api/tasks", authenticateToken, (req, res) => {
    const tasks = db.prepare("SELECT t.*, u.name as assigned_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id ORDER BY t.due_date ASC").all();
    res.json(tasks);
  });

  app.post("/api/tasks", authenticateToken, (req: any, res) => {
    const { title, description, due_date, assigned_to } = req.body;
    const result = db.prepare(
      "INSERT INTO tasks (title, description, due_date, assigned_to) VALUES (?, ?, ?, ?)"
    ).run(title, description, due_date, assigned_to);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/tasks/:id/status", authenticateToken, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ message: "Task updated" });
  });

  // Grocery
  app.get("/api/grocery", authenticateToken, (req, res) => {
    const items = db.prepare("SELECT g.*, u.name as user_name FROM grocery_items g LEFT JOIN users u ON g.user_id = u.id").all();
    res.json(items);
  });

  app.post("/api/grocery", authenticateToken, (req: any, res) => {
    const { item } = req.body;
    const result = db.prepare(
      "INSERT INTO grocery_items (item, user_id) VALUES (?, ?)"
    ).run(item, req.user.id);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/grocery/:id/status", authenticateToken, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE grocery_items SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ message: "Updated" });
  });

  app.delete("/api/grocery/completed", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM grocery_items WHERE status = 'bought'").run();
    res.json({ message: "Cleared completed items" });
  });

  // Chat
  app.get("/api/chat", authenticateToken, (req, res) => {
    const messages = db.prepare(`
      SELECT c.*, u.name as user_name, u.profile_url 
      FROM chat_messages c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC LIMIT 50
    `).all();
    res.json(messages.reverse());
  });

  app.post("/api/chat", authenticateToken, (req: any, res) => {
    const { message } = req.body;
    const result = db.prepare(
      "INSERT INTO chat_messages (user_id, message) VALUES (?, ?)"
    ).run(req.user.id, message);
    res.json({ id: result.lastInsertRowid });
  });

  // Gallery
  app.get("/api/gallery", authenticateToken, (req, res) => {
    const items = db.prepare(`
      SELECT g.*, u.name as user_name 
      FROM gallery_items g 
      JOIN users u ON g.user_id = u.id 
      ORDER BY g.created_at DESC
    `).all();
    res.json(items);
  });

  app.post("/api/gallery", authenticateToken, (req: any, res) => {
    const { title, image_url } = req.body;
    const result = db.prepare(
      "INSERT INTO gallery_items (user_id, title, image_url) VALUES (?, ?, ?)"
    ).run(req.user.id, title, image_url);
    res.json({ id: result.lastInsertRowid });
  });

  // Users list (for assignment/management)
  app.get("/api/users", authenticateToken, (req, res) => {
    const users = db.prepare("SELECT id, name, role, email FROM users").all();
    res.json(users);
  });

  // Users Management
  app.post("/api/admin/users", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Insufficient permissions" });
    const { email, password, name, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare(
        "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)"
      ).run(email, hashedPassword, name, role || 'member');
      res.json({ id: result.lastInsertRowid, message: "User created" });
    } catch (error: any) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.patch("/api/admin/users/:id/role", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Insufficient permissions" });
    const { role } = req.body;
    
    // Protect primary admin from demotion
    const userToUpdate: any = db.prepare("SELECT email FROM users WHERE id = ?").get(req.params.id);
    if (userToUpdate?.email === 'gkrismantara@gmail.com') {
      return res.status(403).json({ error: "Cannot change role of primary administrator" });
    }

    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ message: "User role updated" });
  });

  app.delete("/api/admin/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Insufficient permissions" });
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    
    // Protect primary admin from deletion
    const userToDelete: any = db.prepare("SELECT email FROM users WHERE id = ?").get(req.params.id);
    if (userToDelete?.email === 'gkrismantara@gmail.com') {
      return res.status(403).json({ error: "Cannot delete primary administrator" });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ message: "User deleted" });
  });

  // Remove the public registration route if it exists, or just keep it for now but we'll hide it in UI.
  // Actually the requirement is "untuk di halaman login hilangkan untuk registrasi user baru".
  // So we can keep the route but it won't be used by the public.

  app.post("/api/user/change-password", authenticateToken, async (req: any, res) => {
    const { oldPassword, newPassword } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid old password" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, req.user.id);
    res.json({ message: "Password updated successfully" });
  });

  app.post("/api/ai/assistant", authenticateToken, async (req: any, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Fetch states from database to supply context
      const dbUsers = db.prepare("SELECT id, name, role FROM users").all();
      const dbTransactions = db.prepare("SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON t.user_id = u.id").all();
      const dbBudgets = db.prepare("SELECT * FROM budgets").all();
      const dbBills = db.prepare("SELECT * FROM bills").all();
      const dbTasks = db.prepare("SELECT t.*, u.name as assigned_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id").all();
      const dbGroceries = db.prepare("SELECT g.*, u.name as user_name FROM grocery_items g LEFT JOIN users u ON g.user_id = u.id").all();

      // System instruction explaining database status
      const systemInstruction = `
You are the Agnisfamily Smart Household AI Companion — a helpful, witty, and highly capable assistant embedded in the private family portal of the Agnis family (Agnisfamily).
Your job is to help the family coordinate chores, analyze budgets, organize grocery lists, and track their financial health.

For context, here is the current state of the family's shared database. Use these exact details whenever answering questions:

1. Family Members:
${JSON.stringify(dbUsers, null, 2)}

2. Financial Transactions:
${JSON.stringify(dbTransactions.slice(-30), null, 2)} (showing last 30 transactions)

3. Monthly Spending Budgets:
${JSON.stringify(dbBudgets, null, 2)}

4. Upcoming and Historical Bills/Liabilities:
${JSON.stringify(dbBills, null, 2)}

5. Assigned Household Chores and Tasks:
${JSON.stringify(dbTasks, null, 2)}

6. Current Grocery Shopping List:
${JSON.stringify(dbGroceries, null, 2)}

Guidelines:
- Speak directly, kindly, and dynamically. Be a warm addition to their private home.
- You can suggest recipes based on their grocery list.
- You can compute if they are exceeding a budget target.
- Keep your answers beautifully structured using scannable markdown, custom bullet points, or bold text.
- Do not make up any numbers outside what's present in the database, but feel free to do math or run calculations based on the lists.
- If they ask to update, add, or delete things, kindly remind them that you can advice them, but they can easily perform these actions inside the respective tabs (Dashboard, Budgets, Bills, Family Planning) using the friendly buttons!
      `.trim();

      // Formulate Gemini request structure
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API Error in /api/ai/assistant:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI response." });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
