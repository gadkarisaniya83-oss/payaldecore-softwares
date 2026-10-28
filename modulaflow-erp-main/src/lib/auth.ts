// Admin-only login helper for Payal Decor ERP.
// Login fakt tya browser session paryant rahto.
// Browser / tab band kela ki login apoap jato, punha login karava lagto.

const ADMIN_ID = "admin"; // <-- apla Admin ID ithe thevaa
const ADMIN_PASSWORD = "payal@123"; // <-- apla Password ithe thevaa

const AUTH_KEY = "payal_decor_admin_auth";

export function login(id: string, password: string): boolean {
  if (id.trim() !== ADMIN_ID || password !== ADMIN_PASSWORD) return false;
  sessionStorage.setItem(AUTH_KEY, "true");
  return true;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  // junaa saved login (localStorage) asel tar kadhun taka
  localStorage.removeItem(AUTH_KEY);
  return sessionStorage.getItem(AUTH_KEY) === "true";
}