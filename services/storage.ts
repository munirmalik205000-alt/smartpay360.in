/**
 * SmartPay360 Safe Bulletproof Storage Layer
 * Modern In-Memory Only Storage implementation to respect client sandbox database requirements.
 */

const memoryCache: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string, defaultValue: string = '[]'): string {
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }
    return defaultValue;
  },

  setItem(key: string, value: string): boolean {
    memoryCache[key] = value;
    return true;
  },

  removeItem(key: string): void {
    delete memoryCache[key];
  }
};
