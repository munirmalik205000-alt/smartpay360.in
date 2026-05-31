
import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Wallet, Users, MessageSquare, Bell, ShieldCheck, ShoppingBag, Store, Sun, Moon, Menu as MenuIcon } from 'lucide-react';
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
      "h-[100dvh] w-full flex items-center justify-center transition-colors duration-200 p-0 md:p-3 overflow-hidden select-none",
      darkMode 
        ? "bg-[radial-gradient(ellipse_at_top,_var(--color-slate-900),_var(--color-slate-950))] text-white" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--color-blue-100),_var(--color-slate-50))] text-black"
    )}>
      {/* 3D HD Premium Mobile Frame Chassis for absolute physical app feel */}
      <div className={cn(
        "relative w-full h-[100dvh] md:h-[850px] md:max-w-[420px] rounded-none md:rounded-[3rem] shadow-none md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] md:border-[10px] md:border-neutral-900 dark:md:border-neutral-800 bg-white dark:bg-slate-950 flex flex-col overflow-hidden transition-all duration-300",
        darkMode ? "text-white" : "text-black"
      )}>
        {/* Smartphone top camera pill notch (only on desktop bezel) */}
        <div className="hidden md:absolute md:top-2 md:left-1/2 md:-translate-x-1/2 md:w-28 md:h-5 md:bg-neutral-900 dark:md:bg-neutral-800 md:rounded-full md:z-[60] md:flex md:items-center md:justify-center md:shadow-inner">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-900 mr-2 shrink-0"></div>
          <div className="w-8 h-1 bg-slate-800/60 rounded-full shrink-0"></div>
        </div>

        {/* Desktop & Mobile Header with white/blue scheme */}
        <header className={cn(
          "shrink-0 backdrop-blur-md border-b z-40 relative transition-colors duration-200 pt-[calc(env(safe-area-inset-top)+1px)] md:pt-4",
          darkMode ? "bg-slate-950/90 border-blue-900/45" : "bg-white/95 border-blue-200 shadow-sm"
        )}>
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Smart Menu Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event('spay-open-menu'));
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer border border-purple-500/30 shrink-0"
                title="Open Smart Menu"
              >
                <MenuIcon size={12} className="group-hover:rotate-180 transition-transform duration-300" />
                <span>Menu</span>
              </button>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="cursor-pointer"
                onClick={() => onTabChange('home')}
              >
                <Logo size="sm" className="scale-[0.85] origin-left" lightText={darkMode} />
              </motion.div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Dark Mode toggle button */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "p-1.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95",
                  darkMode ? "text-amber-400 hover:bg-slate-800" : "text-blue-700 hover:bg-blue-100/50"
                )}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button className="p-1.5 text-blue-700 hover:text-blue-950 transition-colors relative cursor-pointer">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full border border-white"></span>
              </button>
              
              <button
                onClick={onLogout}
                className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar w-full py-4 px-4 relative bg-slate-50 dark:bg-slate-900 transition-colors">
          {children}
        </main>

        {/* Mobile-authentic Bottom Navigation always displayed inside the phone body mockup */}
        <nav className={cn(
          "shrink-0 backdrop-blur-xl border-t px-4 pt-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around items-center z-40 relative transition-colors duration-200",
          darkMode ? "bg-slate-950/95 border-blue-900/40" : "bg-white/95 border-blue-200"
        )}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-all relative cursor-pointer py-1",
                activeTab === item.id 
                  ? "text-blue-800" 
                  : "text-slate-500 hover:text-blue-700"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                activeTab === item.id ? "bg-blue-100/80 text-blue-850" : ""
              )}>
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              <span className="text-[8.5px] font-black uppercase tracking-wider">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabDot"
                  className="absolute bottom-0 w-1 h-1 bg-blue-700 rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Realistic virtual physical Home Indicator Bar on simulated phone base */}
        <div className="hidden md:block shrink-0 h-4 bg-white dark:bg-slate-950 relative">
          <div className="absolute bottom-1 right-1/2 translate-x-1/2 w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
