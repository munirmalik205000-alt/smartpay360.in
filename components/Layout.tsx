
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
      darkMode ? "bg-slate-900 text-white animate-fade-in" : "bg-blue-50/50 text-black animate-fade-in"
    )}>
      {/* Desktop & Mobile Header with white/blue scheme */}
      <header className={cn(
        "shrink-0 backdrop-blur-md border-b z-40 relative transition-colors duration-200",
        darkMode ? "bg-slate-950/90 border-blue-900/45" : "bg-white/95 border-blue-200 shadow-sm"
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
              <span className="ml-2 px-2.5 py-1 bg-green-50 text-green-800 text-[9px] font-black rounded-full uppercase tracking-widest border border-green-300 flex items-center gap-1 shadow-sm">
                <ShieldCheck size={10} className="text-green-700" /> ADMIN
              </span>
            )}
            {user.role === UserRole.VENDOR && (
              <span className="ml-2 px-2.5 py-1 bg-blue-50 text-blue-800 text-[9px] font-black rounded-full uppercase tracking-widest border border-blue-300 flex items-center gap-1 shadow-sm">
                <Store size={10} className="text-blue-700" /> VENDOR
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Dark Mode toggle button */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95",
                darkMode ? "text-amber-400 hover:bg-slate-800" : "text-blue-700 hover:bg-blue-100/50"
              )}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="p-2 text-blue-700 hover:text-blue-950 transition-colors relative cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
            </button>
            
            <div className={cn("h-8 w-px mx-1 hidden sm:block", darkMode ? "bg-slate-800" : "bg-blue-200")}></div>

            <div className={cn("text-right hidden sm:block", darkMode ? "text-slate-100" : "text-slate-900")}>
              <p className={cn("text-xs font-black leading-tight uppercase tracking-wider", darkMode ? "text-white" : "text-slate-950")}>{user.name}</p>
              <p className={cn("text-[10px] font-extrabold uppercase", darkMode ? "text-blue-300" : "text-blue-800")}>{user.email}</p>
            </div>

            <button
              onClick={onLogout}
              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all cursor-pointer"
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

      {/* Mobile Bottom Navigation style modifications */}
      <nav className={cn(
        "shrink-0 backdrop-blur-xl border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-around items-center z-50 md:hidden relative transition-colors duration-200",
        darkMode ? "bg-slate-950/95 border-blue-900/40" : "bg-white/95 border-blue-200"
      )}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all relative cursor-pointer",
              activeTab === item.id 
                ? "text-blue-800" 
                : "text-slate-500 hover:text-blue-700"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === item.id ? "bg-blue-100 text-blue-805" : ""
            )}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTabDot"
                className="absolute -top-1 w-1.5 h-1.5 bg-blue-700 rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      <footer className={cn(
        "shrink-0 border-t py-6 hidden md:block transition-colors duration-200",
        darkMode ? "bg-slate-950 border-blue-900/40 text-slate-500" : "bg-white border-blue-100 text-blue-900"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] font-black uppercase tracking-[0.25em]">
          &copy; {new Date().getFullYear()} SmartPay 360 Ecosystem. All Rights Reserved. Used with White & Blue Theme.
        </div>
      </footer>
    </div>
  );
};
