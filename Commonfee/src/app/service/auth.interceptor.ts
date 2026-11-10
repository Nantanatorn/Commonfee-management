import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const API_URL = 'http://localhost:3500';

// แนบ JWT token ให้ทุก request ที่ไปหา API ของเรา (ถ้า request นั้นยังไม่ได้ระบุ Authorization เอง)
// และถ้า token หมดอายุ/ไม่ถูกต้อง ให้ล้าง token แล้วพาไปหน้า login
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: object) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(API_URL)) {
      return next.handle(req);
    }

    let token: string | null = null;
    try {
      token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    } catch {
      token = null;
    }

    const authReq = token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        // ทำเฉพาะในเบราว์เซอร์: ฝั่ง SSR ไม่มี token อยู่แล้ว (401 เป็นเรื่องปกติ) และห้าม redirect ตอนเรนเดอร์บนเซิร์ฟเวอร์
        if (isPlatformBrowser(this.platformId) && err instanceof HttpErrorResponse && this.isSessionExpired(err, req.url)) {
          try {
            localStorage.removeItem('token');
          } catch { /* ไม่มี localStorage (เช่น SSR) */ }
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  // 401 จาก route ที่ต้อง login (ยกเว้นหน้า login เอง) หรือ 403 "Invalid token" = token หมดอายุ/ใช้ไม่ได้
  // (403 "Permission denied" คือ role ไม่พอ ไม่ใช่ session หมดอายุ จึงไม่ล้าง token)
  private isSessionExpired(err: HttpErrorResponse, url: string): boolean {
    if (url.startsWith(`${API_URL}/login`)) return false;
    if (err.status === 401) return true;
    return err.status === 403 && err.error?.message === 'Invalid token';
  }
}
