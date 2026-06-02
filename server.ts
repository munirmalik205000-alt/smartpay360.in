import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

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

  // GET and POST payment requests with Supabase integration and local fallback
  app.get("/api/payment-requests", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        // Map database fields to camelCase
        const mapped = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          amount: parseFloat(item.amount),
          utr: item.utr,
          screenshot: item.screenshot,
          status: item.status,
          createdAt: item.created_at
        }));
        return res.json(mapped);
      } else if (error) {
        console.info("Serving payment requests from local ledger.");
      }
    } catch (dbErr: any) {
      console.info("Serving payment requests from local ledger fallback.");
    }
    return res.json(readJsonFileSync(PAYMENTS_FILE));
  });

  app.post("/api/payment-requests", async (req, res) => {
    const list = readJsonFileSync(PAYMENTS_FILE);
    const newReqId = `PAY${Date.now()}`;
    const newReq = {
      id: newReqId,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body
    };

    try {
      const { error } = await supabase
        .from("payment_requests")
        .insert([{
          id: newReq.id,
          user_id: newReq.userId,
          user_name: newReq.userName,
          amount: Number(newReq.amount),
          utr: newReq.utr,
          screenshot: newReq.screenshot,
          status: newReq.status,
          created_at: newReq.createdAt
        }]);
      if (!error) {
        console.log("Payment request saved to Supabase successfully.");
      } else {
        console.info("Payment request logged to local ledger fallback.");
      }
    } catch (dbErr: any) {
      console.info("Payment request logged to local ledger fallback catch.");
    }

    list.unshift(newReq);
    writeJsonFileSync(PAYMENTS_FILE, list);
    return res.json(newReq);
  });

  // UPDATE payment request status
  app.post("/api/payment-requests/update", async (req, res) => {
    const { id, status } = req.body;

    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status })
        .eq("id", id);
      if (!error) {
        console.log("Payment request status updated in Supabase.");
      } else {
        console.info("Payment status updated locally.");
      }
    } catch (dbErr: any) {
      console.info("Payment status updated locally catch.");
    }

    let list = readJsonFileSync(PAYMENTS_FILE);
    list = list.map((item: any) => item.id === id ? { ...item, status } : item);
    writeJsonFileSync(PAYMENTS_FILE, list);
    return res.json({ success: true, list });
  });

  // GET and POST withdrawal requests with Supabase integration and local fallback
  app.get("/api/withdrawal-requests", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          amount: parseFloat(item.amount),
          status: item.status,
          createdAt: item.created_at,
          bankDetails: item.bank_details
        }));
        return res.json(mapped);
      } else if (error) {
        console.info("Serving withdrawal requests from local ledger.");
      }
    } catch (dbErr: any) {
      console.info("Serving withdrawal requests from local ledger fallback.");
    }
    return res.json(readJsonFileSync(WITHDRAWALS_FILE));
  });

  app.post("/api/withdrawal-requests", async (req, res) => {
    const list = readJsonFileSync(WITHDRAWALS_FILE);
    const newReqId = `WITH${Date.now()}`;
    const newReq = {
      id: newReqId,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body
    };

    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .insert([{
          id: newReq.id,
          user_id: newReq.userId,
          user_name: newReq.userName,
          amount: Number(newReq.amount),
          status: newReq.status,
          created_at: newReq.createdAt,
          bank_details: newReq.bankDetails
        }]);
      if (!error) {
        console.log("Withdrawal request saved to Supabase successfully.");
      } else {
        console.info("Withdrawal request logged to local ledger fallback.");
      }
    } catch (dbErr: any) {
      console.info("Withdrawal request logged to local ledger fallback catch.");
    }

    list.unshift(newReq);
    writeJsonFileSync(WITHDRAWALS_FILE, list);
    return res.json(newReq);
  });

  app.post("/api/withdrawal-requests/update", async (req, res) => {
    const { id, status } = req.body;

    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status })
        .eq("id", id);
      if (!error) {
        console.log("Withdrawal request status updated in Supabase.");
      } else {
        console.info("Withdrawal request status updated locally.");
      }
    } catch (dbErr: any) {
      console.info("Withdrawal request status updated locally catch.");
    }

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
