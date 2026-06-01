
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hexagonal Logo Component */}
            <div className="relative w-10 h-10">
               <svg viewBox="0 0 100 100" className="w-full h-full">
                 <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="#0077C0" />
                 <path d="M30 40 C 30 30, 70 30, 70 40 L 70 45 C 70 55, 30 55, 30 65 L 30 70 C 30 80, 70 80, 70 70" fill="none" stroke="white" strokeWidth="15" strokeLinecap="round" transform="translate(0, -2)"/>
               </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-[#003B73] leading-none">SmartPay</span>
              <span className="text-[10px] font-black text-[#4DB8E5] tracking-[0.2em] leading-none uppercase">360</span>
            </div>
            {user.role === UserRole.ADMIN && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full uppercase tracking-widest border border-green-200">ADMIN</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-tight uppercase tracking-wider">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-[10px] font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all border bg-white shadow-sm uppercase tracking-widest"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} SmartPay 360 Ecosystem. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
