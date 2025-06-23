import type { User } from "@shared/schema";

const CURRENT_USER_KEY = "swaasth_buddy_current_user";
const USER_ID_KEY = "swaasth_buddy_user_id";

export function getCurrentUser(): User | null {
  try {
    let userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) {
      userStr = sessionStorage.getItem(CURRENT_USER_KEY);
    }
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export function setCurrentUser(user: User, rememberMe: boolean): void {
  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear the other storage to prevent conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(CURRENT_USER_KEY);
    otherStorage.removeItem(USER_ID_KEY);

    storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    storage.setItem(USER_ID_KEY, user.id.toString());
  } catch (error) {
    console.error("Error setting current user:", error);
  }
}

export function getCurrentUserId(): number | null {
  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = sessionStorage.getItem(USER_ID_KEY);
    }
    return userId ? parseInt(userId, 10) : null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
  } catch (error) {
    console.error("Error clearing current user:", error);
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function isPremiumUser(): boolean {
  const user = getCurrentUser();
  return user?.isPremium || false;
}

export function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
