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

  const PAYMENTS_FILE = path.join(process.cwd(), "data", "payment_requests.json");
  const WITHDRAWALS_FILE = path.join(process.cwd(), "data", "withdrawal_requests.json");
  const CHATS_FILE = path.join(process.cwd(), "data", "chat_messages.json");

  // Helper to read JSON file or return empty array
  const readJsonFileSync = (filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      console.error("Error reading file:", filePath, e);
    }
    return [];
  };

  // Helper to write JSON file safely
  const writeJsonFileSync = (filePath: string, data: any) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing file:", filePath, e);
    }
  };

  // GET and POST payment requests
  app.get("/api/payment-requests", (req, res) => {
    return res.json(readJsonFileSync(PAYMENTS_FILE));
  });

  app.post("/api/payment-requests", (req, res) => {
    const list = readJsonFileSync(PAYMENTS_FILE);
    const newReq = {
      id: `PAY${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body
    };
    list.unshift(newReq);
    writeJsonFileSync(PAYMENTS_FILE, list);
    return res.json(newReq);
  });

  // UPDATE payment request status
  app.post("/api/payment-requests/update", (req, res) => {
    const { id, status } = req.body;
    let list = readJsonFileSync(PAYMENTS_FILE);
    list = list.map((item: any) => item.id === id ? { ...item, status } : item);
    writeJsonFileSync(PAYMENTS_FILE, list);
    return res.json({ success: true, list });
  });

  // GET and POST withdrawal requests
  app.get("/api/withdrawal-requests", (req, res) => {
    return res.json(readJsonFileSync(WITHDRAWALS_FILE));
  });

  app.post("/api/withdrawal-requests", (req, res) => {
    const list = readJsonFileSync(WITHDRAWALS_FILE);
    const newReq = {
      id: `WITH${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body
    };
    list.unshift(newReq);
    writeJsonFileSync(WITHDRAWALS_FILE, list);
    return res.json(newReq);
  });

  app.post("/api/withdrawal-requests/update", (req, res) => {
    const { id, status } = req.body;
    let list = readJsonFileSync(WITHDRAWALS_FILE);
    list = list.map((item: any) => item.id === id ? { ...item, status } : item);
    writeJsonFileSync(WITHDRAWALS_FILE, list);
    return res.json({ success: true, list });
  });

  // GET and POST chat messages
  app.get("/api/chat-messages", (req, res) => {
    return res.json(readJsonFileSync(CHATS_FILE));
  });

  app.post("/api/chat-messages", (req, res) => {
    const list = readJsonFileSync(CHATS_FILE);
    const newMsg = {
      id: `MSG${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...req.body
    };
    list.push(newMsg);
    writeJsonFileSync(CHATS_FILE, list);
    return res.json(newMsg);
  });

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
      let currentConfig: any = {};
      if (fs.existsSync(CONFIG_FILE)) {
        try {
          currentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        } catch (_) {}
      }
      
      const updatedConfig = { ...currentConfig };

      // Apply incoming body parameters, ignoring undefined or empty values for logo/qrCode if currentConfig has them
      for (const key of Object.keys(req.body)) {
        const val = req.body[key];
        
        // Specially protect logo/qrCode: don't overwrite existing values with empty/null/undefined
        if ((key === 'customLogo' || key === 'qrCode') && !val && currentConfig[key]) {
          // Keep existing
          continue;
        }

        updatedConfig[key] = val;
      }

      // Handle explicit removals
      if (req.body.removeLogo === true) {
        updatedConfig.customLogo = "";
      }
      if (req.body.removeQr === true) {
        updatedConfig.qrCode = "";
      }
      
      // If client sent businessName, also make sure we map it as needed or vice versa
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
