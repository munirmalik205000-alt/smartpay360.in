import React, { useState, useEffect, useRef } from 'react';
import { cn, compressImage, getApiUrl } from '../services/utils';
import { Camera } from 'lucide-react';
import { safeLocalStorage } from '../services/storage';
import { supabase } from '../services/supabaseClient';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lightText?: boolean;
  customLogo?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  iconOnly = false,
  size = 'md',
  lightText = true,
  customLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentLogo, setCurrentLogo] = useState<string | undefined>(customLogo || localStorage.getItem('spay_custom_logo') || undefined);
  const [systemName, setSystemName] = useState<string>(localStorage.getItem('spay_system_name') || '');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const checkAdminRole = async () => {
    try {
      const userStr = safeLocalStorage.getItem('spay_current_user', '');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role === 'ADMIN') {
          setIsAdmin(true);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.user.email === 'admin@spay.com') {
          setIsAdmin(true);
          return;
        }
        const { data: u } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (u && (u.role === 'ADMIN' || u.role === 'admin')) {
          setIsAdmin(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setIsAdmin(false);
  };

  const getLogoSizeClass = () => {
    // Elegant uniform banner-style aspect ratio for both custom image and vector SVG logos
    const bannerClasses = {
      sm: 'w-32 h-10',
      md: 'w-40 h-12 md:w-48 md:h-14',
      lg: 'w-64 h-20 md:w-72 md:h-24 max-w-full',
      xl: 'w-72 h-24 md:w-80 md:h-28 max-w-full',
    };
    return bannerClasses[size];
  };

  const loadFromLocalStorage = async () => {
    try {
      // 1. Fast fallback from localStorage so we render instantly
      const localLogo = localStorage.getItem('spay_custom_logo');
      const localName = localStorage.getItem('spay_system_name');
      if (localLogo) {
        setCurrentLogo(localLogo);
      }
      if (localName) {
        setSystemName(localName);
      }

      // 2. Load from server database API config
      const res = await fetch(getApiUrl('/api/config'));
      if (res.ok) {
        const parsed = await res.json();
        if (parsed) {
          if (parsed.customLogo) {
            setCurrentLogo(parsed.customLogo);
            localStorage.setItem('spay_custom_logo', parsed.customLogo);
          } else {
            if (!localLogo) setCurrentLogo(undefined);
          }
          if (parsed.systemName) {
            setSystemName(parsed.systemName);
            localStorage.setItem('spay_system_name', parsed.systemName);
          } else {
            if (!localName) setSystemName('');
          }
        }
      }
    } catch (err: any) {
      if (err && err.message !== 'Failed to fetch') {
         console.warn('Error loading brand config dynamically');
      }
    }
  };

  useEffect(() => {
    loadFromLocalStorage();
    checkAdminRole();

    const handleUpdate = () => {
      loadFromLocalStorage();
      checkAdminRole();
    };

    window.addEventListener('spay-logo-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('spay-logo-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [customLogo]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Raw = reader.result as string;
        try {
          const base64Data = await compressImage(base64Raw);
          
          // Use synchronous React state updater if registered to guarantee no race conditions
          if (typeof (window as any).spay_update_logo === 'function') {
            (window as any).spay_update_logo(base64Data);
            return;
          }

          const config = { customLogo: base64Data };
          
          // Instantly sync to local storage for zero-delay visual updates across components
          localStorage.setItem('spay_custom_logo', base64Data);
          
          // Save to server-side persistent system configuration
          fetch(getApiUrl('/api/config'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
          }).catch(() => {});

          // Dispatch global reactive event to update all Logo components instantly
          window.dispatchEvent(new Event('spay-logo-updated'));
        } catch (err) {
          console.warn(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Setup heights for custom image logo
  const sizeHeights = {
    sm: 'h-6',
    md: 'h-8 md:h-10',
    lg: 'h-12 md:h-16',
    xl: 'h-16 md:h-20',
  };
  const currentHeight = sizeHeights[size];

  // Render overlay elements to upload a new logo
  const renderUploaderOverlay = () => (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* Sleek direct upload camera edit circle on hover */}
      <div 
        onClick={handleLogoClick}
        className="absolute inset-0 bg-purple-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 rounded-xl cursor-pointer z-20 gap-1"
        title="Direct Upload Logo"
      >
        <Camera size={size === 'sm' ? 12 : 16} className="text-white animate-bounce" />
        <span className="text-[7px] text-white font-black uppercase tracking-wider text-center px-1">
          Upload
        </span>
      </div>
    </>
  );

  return (
    <div className={cn("flex items-center justify-center select-none group relative mx-auto", className)}>
      {/* Dynamic branding logo wrapper */}
      <div className={cn(
        "relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]", 
        getLogoSizeClass(),
        currentLogo && lightText ? "bg-white p-2 rounded-2xl shadow-lg border border-slate-700/20" : ""
      )}>
        {currentLogo ? (
          <img 
            src={currentLogo} 
            alt="SmartPay 360" 
            className={cn(
              "w-full h-full object-contain transition-all duration-300",
              !lightText && "mix-blend-multiply"
            )}
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="s360-sky-lite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              
              <linearGradient id="s360-sky-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              <linearGradient id="s360-navy-lite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>

              <linearGradient id="s360-navy-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>

            {/* S-shaped hexagon logo on the left - translated & scaled to fit 80px high container */}
            <g transform="translate(10, 5) scale(0.7)">
              {/* Upper Loop (Sky/Blue Gradient) */}
              <path d="M 14,31 L 50,10 L 50,21 L 23,36 Z" fill="url(#s360-sky-lite)" />
              <path d="M 50,10 L 86,31 L 86,41 L 50,21 Z" fill="url(#s360-sky-dark)" />
              <path d="M 86,31 L 86,51 L 68,61 L 68,41 Z" fill="url(#s360-sky-dark)" />
              <path d="M 68,41 L 68,51 L 50,61 L 50,51 Z" fill="url(#s360-sky-lite)" />
              <path d="M 50,51 L 50,61 L 32,51 L 32,41 Z" fill="url(#s360-sky-lite)" />
              <path d="M 32,41 L 50,31 L 68,41 L 50,48 Z" fill="url(#s360-sky-dark)" opacity="0.85" />

              {/* Lower Loop (Navy/Blue Gradient) */}
              <path d="M 86,69 L 50,90 L 50,79 L 77,64 Z" fill="url(#s360-navy-lite)" />
              <path d="M 50,90 L 14,69 L 14,59 L 50,79 Z" fill="url(#s360-navy-dark)" />
              <path d="M 14,69 L 14,49 L 32,39 L 32,59 Z" fill="url(#s360-navy-dark)" />
              <path d="M 32,59 L 32,49 L 50,39 L 50,49 Z" fill="url(#s360-navy-lite)" />
              <path d="M 50,49 L 50,39 L 68,49 L 68,59 Z" fill="url(#s360-navy-lite)" />
              <path d="M 68,59 L 50,69 L 32,59 L 50,52 Z" fill="url(#s360-navy-dark)" opacity="0.85" />
            </g>

            {/* Stylized Brand Typography on the right */}
            <text 
              x="90" 
              y="38" 
              fontFamily="'Inter', ui-sans-serif, system-ui, sans-serif" 
              fontWeight="800" 
              fontSize="28" 
              fill={lightText ? "#ffffff" : "#0c4a6e"}
              letterSpacing="-0.03em"
            >
              SmartPay
            </text>
            <text 
              x="90" 
              y="66" 
              fontFamily="'Inter', ui-sans-serif, system-ui, sans-serif" 
              fontWeight="700" 
              fontSize="26" 
              fill={lightText ? "#38bdf8" : "#0ea5e9"}
              letterSpacing="-0.02em"
            >
              360
            </text>
          </svg>
        )}
        
        {/* Render our upload triggers right in the logo box */}
        {isAdmin && renderUploaderOverlay()}
      </div>
    </div>
  );
};
