import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../services/utils';
import { Camera } from 'lucide-react';
import { safeLocalStorage } from '../services/storage';

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
  const [currentLogo, setCurrentLogo] = useState<string | undefined>(customLogo);
  const [systemName, setSystemName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const checkAdminRole = () => {
    try {
      const userStr = safeLocalStorage.getItem('spay_current_user', '');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role === 'ADMIN') {
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
    if (currentLogo) {
      const bannerClasses = {
        sm: 'w-28 h-8 md:w-32 md:h-10',
        md: 'w-40 h-12 md:w-48 md:h-14',
        lg: 'w-64 h-20 md:w-72 md:h-24 max-w-full',
        xl: 'w-72 h-24 md:w-80 md:h-28 max-w-full',
      };
      return bannerClasses[size];
    }
    const squareClasses = {
      sm: 'w-10 h-10',
      md: 'w-14 h-14',
      lg: 'w-24 h-24',
      xl: 'w-32 h-32',
    };
    return squareClasses[size];
  };

  const loadFromLocalStorage = () => {
    try {
      const configStr = safeLocalStorage.getItem('spay_config', '{}');
      if (configStr && configStr !== '{}') {
        const parsed = JSON.parse(configStr);
        if (parsed) {
          if (parsed.customLogo) {
            setCurrentLogo(parsed.customLogo);
          } else {
            setCurrentLogo(undefined);
          }
          if (parsed.systemName) {
            setSystemName(parsed.systemName);
          } else {
            setSystemName('');
          }
        }
      } else {
        setCurrentLogo(undefined);
        setSystemName('');
      }
    } catch {
      // ignore
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
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        try {
          const configStr = safeLocalStorage.getItem('spay_config', '{}');
          const config = JSON.parse(configStr);
          config.customLogo = base64Data;
          safeLocalStorage.setItem('spay_config', JSON.stringify(config));
          
          // Dispatch global reactive event to update all Logo components instantly
          window.dispatchEvent(new Event('spay-logo-updated'));
        } catch (err) {
          console.error(err);
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
      {/* Logo Icon portion */}
      <div className={cn("relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105", currentLogo ? "bg-transparent shadow-none" : "rounded-2xl overflow-hidden shadow-sm", getLogoSizeClass())}>
        {currentLogo ? (
          <img 
            src={currentLogo} 
            alt="Logo Icon" 
            className={cn(
              "w-full h-full object-contain transition-all duration-300",
              lightText 
                ? "invert contrast-125 brightness-110 mix-blend-screen" 
                : "mix-blend-multiply"
            )}
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_12px_rgba(2,132,199,0.3)]">
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
          </svg>
        )}
        
        {/* Render our upload triggers right in the logo box */}
        {isAdmin && renderUploaderOverlay()}
      </div>
    </div>
  );
};
