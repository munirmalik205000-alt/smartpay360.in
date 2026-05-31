import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(apiPath: string): string {
  if (typeof window === 'undefined') {
    return apiPath;
  }
  const origin = window.location.origin;
  
  // Determine if the current origin is prone to WebView isolation (file://, local cap, capacitor://, app://, etc.)
  const isWebviewProne = 
    origin.startsWith('file:') || 
    origin.startsWith('app:') || 
    origin.startsWith('capacitor:') || 
    origin.startsWith('ionic:') || 
    origin === 'null' || 
    origin === '' || 
    (origin.includes('localhost') && !origin.includes('3000'));
  
  // Use the platform's shared production URL as the unified single database backend
  const fallbackBase = "https://ais-pre-2bnvs4k2s663l3dqj5isvs-486559870289.asia-east1.run.app";
  
  // Allow manual dynamic overriding via local storage query if they bind their own custom domains
  const customBase = localStorage.getItem('spay_api_custom_base');
  const base = customBase || (isWebviewProne ? fallbackBase : origin);
  
  return `${base.replace(/\/$/, '')}${apiPath}`;
}

export function compressImage(base64Str: string, maxWidth = 360, maxHeight = 100): Promise<string> {
  return new Promise((resolve) => {
    // If it is not a base64 string or doesn't start with data:, resolve immediately
    if (!base64Str || !base64Str.startsWith('data:')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while sizing down to standard max bounds
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress into a lightweight png to keep logo pristine and light
          resolve(canvas.toDataURL('image/png', 0.85));
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        console.warn('Failed memory compression, falling back to original:', e);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

