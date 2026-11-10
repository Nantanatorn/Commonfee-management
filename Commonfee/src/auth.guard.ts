import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './app/service/auth.service';

// ต้อง login (token ยังไม่หมดอายุ)
// ฝั่งเซิร์ฟเวอร์ (SSR) ไม่มี token จึงปล่อยผ่านไปก่อน แล้วให้ guard ฝั่งเบราว์เซอร์ตัดสินหลัง hydrate
// (ถ้าเช็กบนเซิร์ฟเวอร์ ผู้ที่ login อยู่จะถูกเด้งไป /login ทุกครั้งที่รีเฟรช)
export const loginGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  auth.clearToken();
  return router.createUrlTree(['/login']);
};

// ต้อง login และมี role ตรงกับที่กำหนด (ไม่สนตัวพิมพ์เล็ก/ใหญ่ เหมือนฝั่ง API)
// ถ้า login แล้วแต่ role ไม่พอ -> พาไปหน้าหลักของ role ตัวเอง
export const roleGuard = (role: string): CanActivateFn => () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    auth.clearToken();
    return router.createUrlTree(['/login']);
  }
  if (auth.hasRole(role)) return true;

  return router.createUrlTree([auth.hasRole('admin') ? '/dashboard' : '/home']);
};
