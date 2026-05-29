
import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Wallet, Users, MessageSquare, Bell, ShieldCheck, ShoppingBag, Store, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  activeTab, 
  onTabChange,
  darkMode,
  setDarkMode
}) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'utility', icon: Wallet, label: 'Recharge' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'mlm', icon: Users, label: 'Refer' },
    { id: 'support', icon: MessageSquare, label: 'Support' },
  ];

  if (user.role === UserRole.ADMIN) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  } else if (user.role === UserRole.VENDOR) {
    navItems.push({ id: 'vendor', icon: Store, label: 'Vendor' });
  }

  return (
    <div className={cn(
      "h-[100dvh] flex flex-col overflow-hidden transition-colors duration-200",
      darkMode ? "bg-[#0c0d1b] text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {/* Desktop & Mobile Header */}
      <header className={cn(
        "shrink-0 backdrop-blur-md border-b z-40 relative transition-colors duration-200",
        darkMode ? "bg-[#101229]/90 border-indigo-500/10" : "bg-white/90 border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cursor-pointer"
              onClick={() => onTabChange('home')}
            >
              <Logo size="md" lightText={darkMode} />
            </motion.div>
            {user.role === UserRole.ADMIN && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-[8px] font-black rounded-full uppercase tracking-widest border border-green-200 dark:border-green-800 flex items-center gap-1">
                <ShieldCheck size={8} /> ADMIN
              </span>
            )}
            {user.role === UserRole.VENDOR && (
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[8px] font-black rounded-full uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Store size={8} /> VENDOR
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Dark Mode toggle button */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-xl transition-all",
                darkMode ? "text-amber-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"
              )}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className={cn("h-8 w-px mx-1 hidden sm:block", darkMode ? "bg-slate-800" : "bg-slate-200")}></div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-black leading-tight uppercase tracking-wider">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{user.email}</p>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "shrink-0 backdrop-blur-xl border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-around items-center z-50 md:hidden relative transition-colors duration-200",
        darkMode ? "bg-[#101229]/95 border-indigo-500/10" : "bg-white/95 border-slate-200"
      )}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all relative",
              activeTab === item.id 
                ? "text-[#8b5cf6]" 
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === item.id ? (darkMode ? "bg-[#8b5cf6]/20" : "bg-[#8b5cf6]/10") : ""
            )}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTabDot"
                className="absolute -top-1 w-1 h-1 bg-[#8b5cf6] rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      <footer className={cn(
        "shrink-0 border-t py-8 hidden md:block transition-colors duration-200",
        darkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} SmartPay 360 Ecosystem. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
