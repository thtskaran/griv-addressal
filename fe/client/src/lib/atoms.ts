import { atom } from 'recoil';

export type UserRole = 'user' | 'admin' | null;

export const userRoleAtom = atom<UserRole>({
  key: 'userRole',
  default: null,
});

export const isAnonymousAtom = atom<boolean>({
  key: 'isAnonymous',
  default: false,
});

export const unreadNotificationsAtom = atom<number>({
  key: 'unreadNotifications',
  default: 3,
});
