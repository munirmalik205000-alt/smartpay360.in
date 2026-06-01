import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware with larger limit for base64 logos
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  const CONFIG_FILE = path.join(process.cwd(), "data", "config.json");

  // Ensure data directory exists
  if (!fs.existsSync(path.join(process.cwd(), "data"))) {
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  }

  // GET config
  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        return res.json(data);
      }
      return res.json({});
    } catch (err) {
      console.error("Error reading config API:", err);
      return res.json({});
    }
  });

  // POST config (merges with existing config)
  app.post("/api/config", (req, res) => {
    try {
      let currentConfig = {};
      if (fs.existsSync(CONFIG_FILE)) {
        try {
          currentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        } catch (_) {}
      }
      
      const updatedConfig = { ...currentConfig, ...req.body };
      
      // If client sent businessName, also make sure we map is as needed or vice versa
      if (req.body.businessName && !req.body.systemName) {
        updatedConfig.systemName = req.body.businessName;
      } else if (req.body.systemName && !req.body.businessName) {
        updatedConfig.businessName = req.body.systemName;
      }

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
      return res.json(updatedConfig);
    } catch (err) {
      console.error("Error updating config API:", err);
      return res.status(500).json({ error: "Failed to update configuration" });
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
