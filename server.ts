import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's configure JSON body parsing with a high limit because base64 logos can be large
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Enable CORS to allow secure API connections from the APK / Mobile Webview
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Path to persistent configuration file on the server's disk
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const configPath = path.join(dataDir, "system-config.json");
  const dbPath = path.join(dataDir, "spay-db.json");

  // Read config endpoint
  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, "utf-8");
        return res.json(JSON.parse(data));
      }
    } catch (err) {
      console.error("Error reading system config:", err);
    }
    return res.json({});
  });

  // Save config endpoint
  app.post("/api/config", (req, res) => {
    try {
      const config = req.body;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      return res.json({ success: true, config });
    } catch (err: any) {
      console.error("Error saving system config:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Read full synchronized database endpoint
  app.get("/api/db", (req, res) => {
    try {
      if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, "utf-8");
        return res.json(JSON.parse(data));
      }
    } catch (err) {
      console.error("Error reading system database:", err);
    }
    return res.json({});
  });

  // Save/Synchronize database endpoint
  app.post("/api/db", (req, res) => {
    try {
      const dbData = req.body;
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error saving system database:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
