import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleSheetsDatabase, LocalDatabase, Database } from "./src/server/db";
import { rbacMiddleware } from "./src/server/middleware/rbac";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Initialization
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  let db: Database;

  if (serviceAccountEmail && privateKey && sheetId) {
    db = new GoogleSheetsDatabase(sheetId, serviceAccountEmail, privateKey);
    console.log("Using Google Sheets Database");
  } else {
    db = new LocalDatabase();
    console.warn("Google Sheets credentials missing. Using local storage mode.");
  }

  const rbac = rbacMiddleware(db);

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const userEmail = req.query.email as string || "admin@school.com";
      const data = await db.getData(userEmail);
      res.json(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  // Generic CRUD with RBAC
  app.post("/api/:collection", rbac, async (req, res) => {
    const { collection } = req.params;
    try {
      const item = { ...req.body, id: req.body.id || Date.now().toString() };
      const result = await db.createItem(collection, item);
      res.status(201).json(result);
    } catch (error) {
      console.error(`Error creating item in ${collection}:`, error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.put("/api/:collection/:id", rbac, async (req, res) => {
    const { collection, id } = req.params;
    try {
      const result = await db.updateItem(collection, id, req.body);
      res.json(result);
    } catch (error) {
      console.error(`Error updating item in ${collection}:`, error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/:collection/:id", rbac, async (req, res) => {
    const { collection, id } = req.params;
    try {
      await db.deleteItem(collection, id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting item from ${collection}:`, error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Vite middleware for development
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
