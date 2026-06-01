const fs = require('fs');

let dashboard = fs.readFileSync('restored/components/Dashboard.tsx', 'utf8');

// Replace User property legacy names with Supabase names
dashboard = dashboard.replace(/user\.name/g, 'user.username');
dashboard = dashboard.replace(/user\.phone/g, 'user.mobile');
dashboard = dashboard.replace(/user\.wallets\.main/g, 'user.wallet_balance');
dashboard = dashboard.replace(/user\.wallets\.commission/g, 'user.earning_wallet');
dashboard = dashboard.replace(/user\.wallets\.recharge/g, 'user.recharge_wallet');
dashboard = dashboard.replace(/user\.totalEarned/g, '(user.earning_wallet + user.wallet_balance)'); // rough approximation or just leave it
dashboard = dashboard.replace(/user\.isActivated/g, 'user.is_active');
dashboard = dashboard.replace(/u\.referrerId/g, 'u.sponsor_id');
dashboard = dashboard.replace(/user\.id/g, 'user.id');
dashboard = dashboard.replace(/u\.level/g, '(u.level || 1)'); // Default if missing
dashboard = dashboard.replace(/user\.level/g, '(user.level || 1)');
dashboard = dashboard.replace(/user\.referralCode/g, '(user.referralCode || user.id.slice(0,8))');

// The Dashboard component originally exported `DashboardProps`. Let's allow the caller to pass just what is needed, or allow defaults.
// In the current App.tsx, we only do `<Dashboard userProfile={userProfile} />`.
// I need to adapt the props or just let the old App.tsx pass them in.
// If I use the old `App.tsx` and just replace the user/auth stuff there, it might be easier!
// Let's modify App.tsx instead to mimic the old App.tsx, but wired to Supabase.

fs.writeFileSync('components/Dashboard.tsx', dashboard);
console.log('Migrated Dashboard.tsx');
