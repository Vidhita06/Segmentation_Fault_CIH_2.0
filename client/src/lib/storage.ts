const STORAGE_PREFIX = "swaasth_buddy_";

export interface StorageOptions {
  serialize?: boolean;
  expire?: number; // seconds
}

export class LocalStorage {
  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    try {
      const storageKey = this.getKey(key);
      let storageValue: string;

      if (options.serialize !== false) {
        const data = {
          value,
          timestamp: Date.now(),
          expire: options.expire ? Date.now() + options.expire * 1000 : null,
        };
        storageValue = JSON.stringify(data);
      } else {
        storageValue = value as string;
      }

      localStorage.setItem(storageKey, storageValue);
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const storageKey = this.getKey(key);
      const item = localStorage.getItem(storageKey);

      if (!item) {
        return defaultValue ?? null;
      }

      try {
        const data = JSON.parse(item);
        
        // Check if item has expired
        if (data.expire && Date.now() > data.expire) {
          this.remove(key);
          return defaultValue ?? null;
        }

        return data.value;
      } catch {
        // If parsing fails, return the raw string
        return item as T;
      }
    } catch (error) {
      console.error(`Error getting localStorage item ${key}:`, error);
      return defaultValue ?? null;
    }
  }

  remove(key: string): void {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error removing localStorage item ${key}:`, error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  exists(key: string): boolean {
    try {
      const storageKey = this.getKey(key);
      return localStorage.getItem(storageKey) !== null;
    } catch (error) {
      console.error(`Error checking localStorage item existence ${key}:`, error);
      return false;
    }
  }

  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key.replace(STORAGE_PREFIX, ""));
        }
      }
      return keys;
    } catch (error) {
      console.error("Error getting all localStorage keys:", error);
      return [];
    }
  }
}

// Singleton instance
export const storage = new LocalStorage();

// Convenience functions for common operations
export const setItem = <T>(key: string, value: T, options?: StorageOptions) => 
  storage.set(key, value, options);

export const getItem = <T>(key: string, defaultValue?: T) => 
  storage.get<T>(key, defaultValue);

export const removeItem = (key: string) => storage.remove(key);

export const clearStorage = () => storage.clear();

// Theme storage helpers
export const getTheme = (): "light" | "dark" | "system" => 
  storage.get("theme", "system") as "light" | "dark" | "system";

export const setTheme = (theme: "light" | "dark" | "system") => 
  storage.set("theme", theme);

// User preferences
export const getUserPreferences = () => ({
  notifications: {
    medicine: storage.get("notifications_medicine", true),
    appointments: storage.get("notifications_appointments", true),
    healthTips: storage.get("notifications_health_tips", false),
  },
  appearance: {
    theme: getTheme(),
  },
});

export const setUserPreference = (key: string, value: any) => 
  storage.set(`preference_${key}`, value);

export const getUserPreference = <T>(key: string, defaultValue?: T) => 
  storage.get<T>(`preference_${key}`, defaultValue);
