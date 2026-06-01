import { User } from './api';

const KEY = 'itoni_user';
const EXP_KEY = 'itoni_session_exp';
const SESSION_DAYS = 30;

export function getUser(): User | null {
  try {
    const exp = localStorage.getItem(EXP_KEY);
    if (exp && Date.now() > Number(exp)) {
      clearUser();
      return null;
    }
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
  localStorage.setItem(EXP_KEY, String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000));
}

export function clearUser() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(EXP_KEY);
}
