import React from 'react';
import { cn } from '../services/utils';

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
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-lg' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl' },
  };

  const currentSize = sizeClasses[size];

  // Resolve custom logo from prop or localStorage fallback
  let resolvedLogo = customLogo;
  if (!resolvedLogo) {
    try {
      const configStr = localStorage.getItem('spay_config');
      if (configStr) {
        const parsed = JSON.parse(configStr);
        if (parsed && parsed.customLogo) {
          resolvedLogo = parsed.customLogo;
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {/* Precision 3D Beveled Isometric Hexagon 'S' logo or Custom Uploded Image */}
      <div className={cn("relative shrink-0 flex items-center justify-center", currentSize.icon)}>
        {resolvedLogo ? (
          <img 
            src={resolvedLogo} 
            alt="Logo" 
            className="w-full h-full object-contain rounded-xl drop-shadow-[0_1px_5px_rgba(0,119,192,0.15)]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,119,192,0.18)]">
            <defs>
              {/* Gradients matching original SmartPay 360 screenshot */}
              <linearGradient id="s360-sky-lite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00adef" />
                <stop offset="100%" stopColor="#0083c6" />
              </linearGradient>
              
              <linearGradient id="s360-sky-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0072bc" />
                <stop offset="100%" stopColor="#005691" />
              </linearGradient>

              <linearGradient id="s360-navy-lite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#005691" />
                <stop offset="100%" stopColor="#003566" />
              </linearGradient>

              <linearGradient id="s360-navy-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#002d5c" />
                <stop offset="100%" stopColor="#001833" />
              </linearGradient>
            </defs>

            {/* Upper Loop (Sky Blue / Cyan) */}
            {/* Top-Left Roof Bevel */}
            <path 
              d="M 14,31 L 50,10 L 50,21 L 23,36 Z" 
              fill="url(#s360-sky-lite)" 
            />
            {/* Top-Right Roof Bevel */}
            <path 
              d="M 50,10 L 86,31 L 86,41 L 50,21 Z" 
              fill="url(#s360-sky-dark)" 
            />
            {/* Middle Right Folding Plate */}
            <path 
              d="M 86,31 L 86,51 L 68,61 L 68,41 Z" 
              fill="url(#s360-sky-dark)" 
            />
            {/* Upper Center Connecting Ribbon */}
            <path 
              d="M 68,41 L 68,51 L 50,61 L 50,51 Z" 
              fill="url(#s360-sky-lite)" 
            />
            {/* Inner Left Return Belt */}
            <path 
              d="M 50,51 L 50,61 L 32,51 L 32,41 Z" 
              fill="url(#s360-sky-lite)" 
            />
            {/* Inside Ceiling Shade */}
            <path 
              d="M 32,41 L 50,31 L 68,41 L 50,48 Z" 
              fill="url(#s360-sky-dark)" 
              opacity="0.85"
            />

            {/* Lower Loop (Warm Corporate Navy / Dark Blue) */}
            {/* Bottom-Right Floor Bevel */}
            <path 
              d="M 86,69 L 50,90 L 50,79 L 77,64 Z" 
              fill="url(#s360-navy-lite)" 
            />
            {/* Bottom-Left Floor Bevel */}
            <path 
              d="M 50,90 L 14,69 L 14,59 L 50,79 Z" 
              fill="url(#s360-navy-dark)" 
            />
            {/* Middle Left Folding Plate */}
            <path 
              d="M 14,69 L 14,49 L 32,39 L 32,59 Z" 
              fill="url(#s360-navy-dark)" 
            />
            {/* Lower Center Connecting Ribbon */}
            <path 
              d="M 32,59 L 32,49 L 50,39 L 50,49 Z" 
              fill="url(#s360-navy-lite)" 
            />
            {/* Inner Right Return Belt */}
            <path 
              d="M 50,49 L 50,39 L 68,49 L 68,59 Z" 
              fill="url(#s360-navy-lite)" 
            />
            {/* Inside Floor Shade */}
            <path 
              d="M 68,59 L 50,69 L 32,59 L 50,52 Z" 
              fill="url(#s360-navy-dark)" 
              opacity="0.85"
            />
          </svg>
        )}
      </div>

      {!iconOnly && (
        <div className="flex flex-col text-left">
          <span className={cn(
            "font-black tracking-tight leading-none",
            size === 'sm' ? 'tracking-tighter text-sm' : 'tracking-tight',
            lightText ? "text-white" : "text-[#002d5c] dark:text-white"
          )}>
            SmartPay
          </span>
          <span className="font-extrabold text-[#00adef] leading-none tracking-widest mt-0.5" style={{ fontSize: size === 'sm' ? '8px' : '10px' }}>
            360
          </span>
        </div>
      )}
    </div>
  );
};
