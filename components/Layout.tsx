
import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Wallet, Users, MessageSquare, Bell, ShieldCheck, ShoppingBag, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'utility', icon: Wallet, label: 'Pay' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'mlm', icon: Users, label: 'Team' },
    { id: 'support', icon: MessageSquare, label: 'Chat' },
  ];

  if (user.role === UserRole.ADMIN) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  } else if (user.role === UserRole.VENDOR) {
    navItems.push({ id: 'vendor', icon: Store, label: 'Vendor' });
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      {/* Desktop & Mobile Header */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-10 h-10"
            >
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                 <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="#003B73" />
                 <path d="M30 40 C 30 30, 70 30, 70 40 L 70 45 C 70 55, 30 55, 30 65 L 30 70 C 30 80, 70 80, 70 70" fill="none" stroke="white" strokeWidth="15" strokeLinecap="round" transform="translate(0, -2)"/>
               </svg>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-brand-primary leading-none">SmartPay</span>
              <span className="text-[10px] font-black text-brand-accent tracking-[0.2em] leading-none uppercase">360</span>
            </div>
            {user.role === UserRole.ADMIN && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                <ShieldCheck size={8} /> ADMIN
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-tight uppercase tracking-wider">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{user.email}</p>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
      <nav className="shrink-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-around items-center z-50 md:hidden relative">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all relative",
              activeTab === item.id ? "text-brand-primary" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === item.id ? "bg-brand-primary/10" : ""
            )}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTabDot"
                className="absolute -top-1 w-1 h-1 bg-brand-primary rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      <footer className="shrink-0 bg-white border-t py-8 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} SmartPay 360 Ecosystem. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
