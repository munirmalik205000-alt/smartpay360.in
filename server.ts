import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

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

  // Supabase Lazy & Robust Client Initialization
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabase: any = null;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log("🟢 SUPABASE: Client successfully initialized!");
    } catch (err) {
      console.error("🔴 SUPABASE: Initialization error:", err);
    }
  } else {
    console.log("🟡 SUPABASE: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY not configured. Falling back to internal JSON filesystem storage.");
  }

  // Path to persistent configuration file on the server's disk
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const configPath = path.join(dataDir, "system-config.json");
  const dbPath = path.join(dataDir, "spay-db.json");

  // Auth endpoints using Supabase Auth & PostgreSQL
  app.post("/api/auth/register", async (req, res) => {
    const data = req.body;
    const email = String(data.email || '').trim().toLowerCase();
    const phone = String(data.phone || '').trim();
    const password = String(data.password || '').trim();

    if (!email || !password || !phone) {
      return res.status(400).json({ success: false, error: "Email, password and phone number are required." });
    }

    // Save to server-side memory & filesystem database first to remain 100% operational
    let currentUsers: any[] = [];
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        currentUsers = parsed.users || [];
      }
    } catch (err) {
      console.error("Read db error during registration:", err);
    }

    if (currentUsers.some(u => u && u.email && u.email.toLowerCase() === email)) {
      return res.status(400).json({ success: false, error: "Email already registered." });
    }

    let authUserUuid = `U${Date.now()}`;

    if (supabase) {
      try {
        console.log(`✨ Registering user via Supabase Auth: ${email}`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              phone: phone,
              name: data.name
            }
          }
        });

        if (signUpError) {
          console.warn("⚠️ Supabase Auth SignUp error:", signUpError.message);
          if (!signUpError.message.includes("already registered")) {
            return res.status(400).json({ success: false, error: signUpError.message });
          }
        } else if (signUpData?.user?.id) {
          authUserUuid = signUpData.user.id;
          console.log(`🟢 Supabase Auth SignUp success: User UUID = ${authUserUuid}`);
        }
      } catch (authErr: any) {
        console.error("🔴 Supabase Auth SignUp exception:", authErr);
      }
    }

    const newUser = {
      ...data,
      id: authUserUuid,
      email: email,
      password: password,
      transactionPin: data.transactionPin ? String(data.transactionPin).trim() : "1111",
      referralCode: data.referralCode || `SP360${Math.floor(1000 + Math.random() * 9000)}`,
      role: data.role || "USER",
      wallets: data.wallets || { main: 0, commission: 0, cashback: 0, recharge: 0, shopping: 0, reward: 0, ewallet: 2000, coinwallet: 0 },
      totalEarned: Number(data.totalEarned || 0),
      status: data.status || "pending",
      level: Number(data.level || 1),
      joinedAt: data.joinedAt || new Date().toISOString(),
      isActivated: !!data.isActivated,
      selfPV: Number(data.selfPV || 0),
      coinUsablePercent: Number(data.coinUsablePercent || 10),
      bankDetails: data.bankDetails || null,
      kycDetails: data.kycDetails || { aadhaarNumber: '', panNumber: '', status: 'not_submitted' },
      rewards: data.rewards || []
    };

    // Save user locally on disk
    try {
      currentUsers.push(newUser);
      let fullDb: any = {};
      if (fs.existsSync(dbPath)) {
        fullDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
      fullDb.users = currentUsers;
      fs.writeFileSync(dbPath, JSON.stringify(fullDb, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("FS save error during registration:", fsErr);
    }

    // Insert user into Supabase Database
    if (supabase) {
      try {
        const userRow = {
          id: newUser.id,
          user_id: newUser.id,
          sponsor_id: newUser.referrerId,
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          transaction_pin: newUser.transactionPin,
          phone: newUser.phone,
          mobile: newUser.phone,
          state: newUser.state,
          referral_code: newUser.referralCode,
          referrer_id: newUser.referrerId,
          role: newUser.role,
          wallets: newUser.wallets,
          wallet_balance: newUser.wallets?.main || 0,
          total_earned: newUser.totalEarned,
          status: newUser.status,
          level: newUser.level,
          rank: newUser.level === 0 ? 'Admin' : `Level ${newUser.level} Partner`,
          joined_at: newUser.joinedAt,
          is_activated: newUser.isActivated,
          self_pv: newUser.selfPV,
          coin_usable_percent: newUser.coinUsablePercent,
          bank_details: newUser.bankDetails,
          kyc_details: newUser.kycDetails,
          rewards: newUser.rewards
        };

        const { error: insertError } = await supabase.from("users").insert([userRow]);
        if (insertError) {
          console.error("🔴 Supabase Users Profile insert error, trying upsert:", insertError);
          await supabase.from("users").upsert([userRow]);
        } else {
          console.log("🟢 Created users profile in Supabase table successfully.");
        }

        // Also add wallets record
        const walletRow = {
          id: `W_${newUser.id}`,
          user_id: newUser.id,
          main: newUser.wallets?.main || 0,
          commission: newUser.wallets?.commission || 0,
          cashback: newUser.wallets?.cashback || 0,
          recharge: newUser.wallets?.recharge || 0,
          shopping: newUser.wallets?.shopping || 0,
          reward: newUser.wallets?.reward || 0,
          ewallet: newUser.wallets?.ewallet || 0,
          coinwallet: newUser.wallets?.coinwallet || 0
        };
        await supabase.from("wallets").upsert([walletRow]);

      } catch (dbErr) {
        console.error("🔴 Supabase Users insert exception:", dbErr);
      }
    }

    return res.json({ success: true, user: newUser });
  });

  // Login Endpoint checking Supabase Auth and User lookup
  app.post("/api/auth/login", async (req, res) => {
    const { emailOrPhone, password } = req.body;
    const trimmedInput = String(emailOrPhone || '').trim().toLowerCase();
    const trimmedPassword = String(password || '').trim();

    if (!trimmedInput || !trimmedPassword) {
      return res.status(400).json({ success: false, error: "Email/Phone and password are required." });
    }

    // Try finding the user record in list first
    let userRecord: any = null;
    let currentUsers: any[] = [];
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, "utf-8");
        currentUsers = JSON.parse(fileContent).users || [];
      }
    } catch {}

    userRecord = currentUsers.find(u => u && (String(u.email).toLowerCase() === trimmedInput || String(u.phone) === trimmedInput));

    if (supabase) {
      try {
        let authEmail = trimmedInput;
        // If they checked in with phone number, resolve their email first via Supabase table
        if (!authEmail.includes("@")) {
          const { data: dbPrf } = await supabase.from("users").select("email, password").eq("phone", trimmedInput).maybeSingle();
          if (dbPrf && dbPrf.email) {
            authEmail = dbPrf.email;
          }
        }

        console.log(`✨ Authenticating via Supabase Auth: ${authEmail}`);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: trimmedPassword
        });

        if (authError) {
          console.warn("⚠️ Supabase Auth signInWithPassword error, checking password match directly inside postgresql:", authError.message);
          // Fallback check PostgreSQL record comparison if auth confirmation is pending
          const { data: userPrf } = await supabase.from("users").select("*").eq("email", authEmail).maybeSingle();
          if (userPrf && userPrf.password === trimmedPassword) {
            console.log("🟢 PostgreSQL direct password comparison matched successfully!");
            const mappedUser = {
              id: userPrf.id,
              name: userPrf.name,
              email: userPrf.email,
              password: userPrf.password,
              transactionPin: userPrf.transaction_pin,
              phone: userPrf.phone,
              state: userPrf.state,
              referralCode: userPrf.referral_code,
              referrerId: userPrf.referrer_id,
              role: userPrf.role,
              wallets: userPrf.wallets,
              totalEarned: Number(userPrf.total_earned || 0),
              status: userPrf.status,
              level: Number(userPrf.level || 0),
              joinedAt: userPrf.joined_at,
              isActivated: !!userPrf.is_activated,
              selfPV: Number(userPrf.self_pv || 0),
              coinUsablePercent: Number(userPrf.coin_usable_percent || 10),
              bankDetails: userPrf.bank_details || undefined,
              kycDetails: userPrf.kyc_details || undefined,
              rewards: userPrf.rewards || undefined
            };
            return res.json({ success: true, user: mappedUser });
          }
          return res.status(401).json({ success: false, error: authError.message });
        } else if (authData && authData.user) {
          console.log("🟢 Supabase Auth signIn success!");
          // Fetch their full profile
          const { data: userPrf } = await supabase.from("users").select("*").eq("id", authData.user.id).maybeSingle();
          if (userPrf) {
            const mappedUser = {
              id: userPrf.id,
              name: userPrf.name,
              email: userPrf.email,
              password: userPrf.password,
              transactionPin: userPrf.transaction_pin,
              phone: userPrf.phone,
              state: userPrf.state,
              referralCode: userPrf.referral_code,
              referrerId: userPrf.referrer_id,
              role: userPrf.role,
              wallets: userPrf.wallets,
              totalEarned: Number(userPrf.total_earned || 0),
              status: userPrf.status,
              level: Number(userPrf.level || 0),
              joinedAt: userPrf.joined_at,
              isActivated: !!userPrf.is_activated,
              selfPV: Number(userPrf.self_pv || 0),
              coinUsablePercent: Number(userPrf.coin_usable_percent || 10),
              bankDetails: userPrf.bank_details || undefined,
              kycDetails: userPrf.kyc_details || undefined,
              rewards: userPrf.rewards || undefined
            };
            return res.json({ success: true, user: mappedUser });
          }
        }
      } catch (authEx) {
        console.error("🔴 Supabase Auth login exception:", authEx);
      }
    }

    // Internal fallback matching disk records
    if (userRecord && userRecord.password === trimmedPassword) {
      return res.json({ success: true, user: userRecord });
    }

    return res.status(401).json({ success: false, error: "Authentication failed. Incorrect email/phone or password." });
  });

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
  app.get("/api/db", async (req, res) => {
    // If Supabase is configured, attempt to fetch from Supabase
    if (supabase) {
      try {
        const [
          { data: dbUsers, error: usersErr },
          { data: dbProducts, error: prodErr },
          { data: dbOrders, error: ordErr },
          { data: dbTransactions, error: txErr },
          { data: dbPayments, error: payErr },
          { data: dbWithdrawals, error: wdErr },
          { data: dbChats, error: chatErr },
          { data: dbPkgs, error: pkgErr }
        ] = await Promise.all([
          supabase.from("users").select("*"),
          supabase.from("products").select("*"),
          supabase.from("orders").select("*"),
          supabase.from("transactions").select("*"),
          supabase.from("payment_requests").select("*"),
          supabase.from("withdrawal_requests").select("*"),
          supabase.from("chat_messages").select("*"),
          supabase.from("packages").select("*")
        ]);

        if (usersErr || prodErr || ordErr || txErr || payErr || wdErr || chatErr || pkgErr) {
          console.warn("⚠️ SUPABASE: Some queries returned error, falling back to local files if tables are not fully seeded:", { usersErr, prodErr, ordErr, txErr });
          throw new Error("Supabase tables not fully ready");
        }

        // Map database snake_case back to frontend camelCase
        const mappedUsers = (dbUsers || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          transactionPin: u.transaction_pin,
          phone: u.phone,
          state: u.state,
          referralCode: u.referral_code,
          referrerId: u.referrer_id,
          role: u.role,
          wallets: u.wallets,
          totalEarned: Number(u.total_earned || 0),
          status: u.status,
          level: Number(u.level || 0),
          joinedAt: u.joined_at,
          isActivated: !!u.is_activated,
          selfPV: Number(u.self_pv || 0),
          coinUsablePercent: Number(u.coin_usable_percent || 10),
          bankDetails: u.bank_details || undefined,
          kycDetails: u.kyc_details || undefined,
          rewards: u.rewards || undefined
        }));

        const mappedProducts = (dbProducts || []).map((p: any) => ({
          id: p.id,
          vendorId: p.vendor_id,
          vendorName: p.vendor_name || undefined,
          name: p.name,
          description: p.description,
          price: Number(p.price || 0),
          mrp: Number(p.mrp || 0),
          category: p.category,
          stock: Number(p.stock || 0),
          image: p.image,
          mlmPoints: Number(p.mlm_points || 0),
          isApproved: !!p.is_approved
        }));

        const mappedOrders = (dbOrders || []).map((o: any) => ({
          id: o.id,
          userId: o.user_id,
          userName: o.user_name || undefined,
          vendorId: o.vendor_id,
          productId: o.product_id,
          productName: o.product_name || undefined,
          amount: Number(o.amount || 0),
          status: o.status,
          createdAt: o.created_at
        }));

        const mappedTransactions = (dbTransactions || []).map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          amount: Number(t.amount || 0),
          walletType: t.wallet_type,
          type: t.type,
          description: t.description,
          status: t.status,
          createdAt: t.created_at
        }));

        const mappedPaymentRequests = (dbPayments || []).map((pr: any) => ({
          id: pr.id,
          userId: pr.user_id,
          userName: pr.user_name,
          amount: Number(pr.amount || 0),
          utr: pr.utr,
          screenshot: pr.screenshot,
          status: pr.status,
          createdAt: pr.created_at
        }));

        const mappedWithdrawals = (dbWithdrawals || []).map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          userName: w.user_name,
          amount: Number(w.amount || 0),
          status: w.status,
          createdAt: w.created_at,
          bankDetails: w.bank_details
        }));

        const mappedChatMessages = (dbChats || []).map((cm: any) => ({
          id: cm.id,
          senderId: cm.sender_id,
          senderName: cm.sender_name,
          receiverId: cm.receiver_id,
          message: cm.message,
          createdAt: cm.created_at
        }));

        const mappedPackages = (dbPkgs || []).map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          price: Number(pkg.price || 0),
          pv: Number(pkg.pv || 0),
          coin: Number(pkg.coin || 0),
          coinUsablePercent: pkg.coin_usable_percent ? Number(pkg.coin_usable_percent) : undefined
        }));

        return res.json({
          users: mappedUsers,
          products: mappedProducts,
          orders: mappedOrders,
          transactions: mappedTransactions,
          paymentRequests: mappedPaymentRequests,
          withdrawalRequests: mappedWithdrawals,
          chatMessages: mappedChatMessages,
          packages: mappedPackages
        });

      } catch (err) {
        console.error("🔴 SUPABASE Error reading table data, falling back to JSON filesystem:", err);
      }
    }

    // Default Fallback
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
  app.post("/api/db", async (req, res) => {
    const dbData = req.body;

    // Always back up database state to disk as well to guarantee reliability
    try {
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("Error backing up database system on disk:", fsErr);
    }

    if (supabase) {
      try {
        const promises: Promise<any>[] = [];

        if (dbData.users && dbData.users.length > 0) {
          const usersRows = dbData.users.map((u: any) => ({
            id: u.id,
            user_id: u.id,
            sponsor_id: u.referrerId,
            name: u.name,
            email: u.email,
            password: u.password,
            transaction_pin: u.transactionPin,
            phone: u.phone,
            mobile: u.phone,
            state: u.state,
            referral_code: u.referralCode,
            referrer_id: u.referrerId,
            role: u.role,
            wallets: u.wallets,
            wallet_balance: u.wallets?.main || 0,
            total_earned: u.totalEarned,
            status: u.status,
            level: u.level,
            rank: u.level === 0 ? 'Admin' : `Level ${u.level} Partner`,
            joined_at: u.joinedAt,
            is_activated: u.isActivated,
            self_pv: u.selfPV || 0,
            coin_usable_percent: u.coinUsablePercent || 10,
            bank_details: u.bankDetails || null,
            kyc_details: u.kycDetails || null,
            rewards: u.rewards || null
          }));
          promises.push(supabase.from("users").upsert(usersRows));

          // Sync referrals table with existing connections
          const referralsRows = dbData.users.filter((u: any) => u.referrerId).map((u: any) => ({
            id: `REF_${u.referrerId}_${u.id}`,
            referrer_id: u.referrerId,
            referred_id: u.id,
            level: u.level || 1
          }));
          if (referralsRows.length > 0) {
            promises.push(supabase.from("referrals").upsert(referralsRows));
          }

          // Sync secondary WALLETS table
          const walletsRows = dbData.users.map((u: any) => ({
            id: `W_${u.id}`,
            user_id: u.id,
            main: u.wallets?.main || 0,
            commission: u.wallets?.commission || 0,
            cashback: u.wallets?.cashback || 0,
            recharge: u.wallets?.recharge || 0,
            shopping: u.wallets?.shopping || 0,
            reward: u.wallets?.reward || 0,
            ewallet: u.wallets?.ewallet || 0,
            coinwallet: u.wallets?.coinwallet || 0
          }));
          promises.push(supabase.from("wallets").upsert(walletsRows));

          // Sync secondary RANKS table
          const ranksRows = dbData.users.map((u: any) => ({
            id: `R_${u.id}`,
            user_id: u.id,
            rank_name: u.level === 0 ? 'Admin' : `Level ${u.level} Partner`,
            achieved_at: u.joinedAt,
            bonus: u.totalEarned || 0
          }));
          promises.push(supabase.from("ranks").upsert(ranksRows));

          // Sync secondary REWARDS table
          const rewardsRows: any[] = [];
          dbData.users.forEach((u: any) => {
            if (u.rewards && Array.isArray(u.rewards)) {
              u.rewards.forEach((r: any) => {
                rewardsRows.push({
                  id: `${u.id}_${r.id || r.rewardId || Math.random().toString().slice(2, 6)}`,
                  user_id: u.id,
                  reward_id: r.id || 'milestone',
                  title: r.title || r.name || 'MLM Reward',
                  target_sales: Number(r.targetSalesCount || r.target_sales || 0),
                  current_sales: Number(r.currentSalesCount || r.current_sales || 0),
                  status: r.status || 'locked',
                  achieved_at: r.achievedAt || null
                });
              });
            }
          });
          if (rewardsRows.length > 0) {
            promises.push(supabase.from("rewards").upsert(rewardsRows));
          }
        }

        if (dbData.products && dbData.products.length > 0) {
          const productsRows = dbData.products.map((p: any) => ({
            id: p.id,
            vendor_id: p.vendorId,
            vendor_name: p.vendorName || null,
            name: p.name,
            description: p.description,
            price: p.price,
            mrp: p.mrp,
            category: p.category,
            stock: p.stock,
            image: p.image,
            mlm_points: p.mlmPoints,
            is_approved: p.isApproved
          }));
          promises.push(supabase.from("products").upsert(productsRows));
        }

        if (dbData.orders && dbData.orders.length > 0) {
          const ordersRows = dbData.orders.map((o: any) => ({
            id: o.id,
            user_id: o.userId,
            user_name: o.userName || null,
            vendor_id: o.vendorId,
            product_id: o.productId,
            product_name: o.productName || null,
            amount: o.amount,
            status: o.status,
            created_at: o.createdAt
          }));
          promises.push(supabase.from("orders").upsert(ordersRows));
        }

        if (dbData.transactions && dbData.transactions.length > 0) {
          const transactionsRows = dbData.transactions.map((t: any) => ({
            id: t.id,
            user_id: t.userId,
            amount: t.amount,
            wallet_type: t.walletType,
            type: t.type,
            description: t.description,
            status: t.status,
            created_at: t.createdAt
          }));
          promises.push(supabase.from("transactions").upsert(transactionsRows));

          // Sync secondary MLM_INCOME table
          const commissionTx = dbData.transactions.filter((t: any) => t.type === 'commission');
          if (commissionTx.length > 0) {
            const mlmIncomeRows = commissionTx.map((t: any) => {
              const desc = String(t.description || '');
              let parsedLevel = 1;
              const levelMatch = desc.match(/Level\s+(\d+)/i);
              if (levelMatch) {
                parsedLevel = parseInt(levelMatch[1]);
              }
              return {
                id: t.id,
                user_id: t.userId,
                from_user_id: null,
                amount: t.amount || 0,
                commission_type: desc.toLowerCase().includes('package') ? 'package' : desc.toLowerCase().includes('recharge') ? 'recharge' : 'product',
                level: parsedLevel,
                created_at: new Date(t.createdAt || Date.now()).toISOString()
              };
            });
            promises.push(supabase.from("mlm_income").upsert(mlmIncomeRows));
          }

          // Sync secondary RECHARGES table with any mobile/utility recharge transactions
          const rechargeTx = dbData.transactions.filter((t: any) => t.type === 'recharge' || String(t.description).toLowerCase().includes('recharge'));
          if (rechargeTx.length > 0) {
            const rechargesRows = rechargeTx.map((t: any) => ({
              id: t.id,
              user_id: t.userId,
              amount: Math.abs(t.amount || 0),
              service: String(t.description).toLowerCase().includes('bill') || String(t.description).toLowerCase().includes('utility') ? 'Utility' : 'Mobile',
              operator: String(t.description).split(' ')[0] || 'Operator',
              status: t.status === 'failed' ? 'failed' : 'success',
              created_at: t.createdAt
            }));
            promises.push(supabase.from("recharges").upsert(rechargesRows));
          }
        }

        if (dbData.paymentRequests && dbData.paymentRequests.length > 0) {
          const paymentsRows = dbData.paymentRequests.map((pr: any) => ({
            id: pr.id,
            user_id: pr.userId,
            user_name: pr.userName,
            amount: pr.amount,
            utr: pr.utr,
            screenshot: pr.screenshot,
            status: pr.status,
            created_at: pr.createdAt
          }));
          promises.push(supabase.from("payment_requests").upsert(paymentsRows));
        }

        if (dbData.withdrawalRequests && dbData.withdrawalRequests.length > 0) {
          const withdrawalsRows = dbData.withdrawalRequests.map((w: any) => ({
            id: w.id,
            user_id: w.userId,
            user_name: w.userName,
            amount: w.amount,
            status: w.status,
            created_at: w.createdAt,
            bank_details: w.bankDetails
          }));
          promises.push(supabase.from("withdrawal_requests").upsert(withdrawalsRows));
          promises.push(supabase.from("withdrawals").upsert(withdrawalsRows));
        }

        if (dbData.chatMessages && dbData.chatMessages.length > 0) {
          const chatsRows = dbData.chatMessages.map((cm: any) => ({
            id: cm.id,
            sender_id: cm.senderId,
            sender_name: cm.senderName,
            receiver_id: cm.receiverId,
            message: cm.message,
            created_at: cm.createdAt
          }));
          promises.push(supabase.from("chat_messages").upsert(chatsRows));
        }

        if (dbData.packages && dbData.packages.length > 0) {
          const pkgsRows = dbData.packages.map((pkg: any) => ({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            pv: pkg.pv,
            coin: pkg.coin,
            coin_usable_percent: pkg.coinUsablePercent || null
          }));
          promises.push(supabase.from("packages").upsert(pkgsRows));
        }

        await Promise.all(promises);
        return res.json({ success: true, database: "supabase" });
      } catch (err: any) {
        console.error("🔴 SUPABASE Save failure, falling back onto local storage logs:", err);
        return res.json({ success: true, database: "filesystem" });
      }
    }

    return res.json({ success: true, database: "filesystem" });
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
