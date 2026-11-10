import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3500'; // Adjust URL if necessary
  private usernameSubject = new BehaviorSubject<string | null>(null);
  public username$ = this.usernameSubject.asObservable();
  public pictureBehaviorSubject = new BehaviorSubject<string | null >(null);
  public picture = this.pictureBehaviorSubject.asObservable();

  // ตอนรันฝั่งเซิร์ฟเวอร์ (SSR) อาจไม่มี localStorage (เช่น Node 22+ ที่ไม่ได้ตั้ง --localstorage-file) จึงต้องกันไว้
  private get storage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        return localStorage;
      }
    } catch { /* เข้าถึง storage ไม่ได้ */ }
    return { getItem: (): string | null => null, setItem: (): void => {}, removeItem: (): void => {} };
  }

  constructor(private router: Router) {

    const token =this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      const firstname = payload?.user?.firstname || null;
      const username =payload?.user?.username || null;
      const picture = payload?.user?.picture || null;
      this.usernameSubject.next(username);
      this.pictureBehaviorSubject.next(picture);
   }
  }

  login(token:string):void{
    this.storage.setItem('token',token);
    const payload =this.decodeToken(token);
    const username =payload?.user?.username || null;
    this.usernameSubject.next(username);
  }

  // Simulate user logout
  logout(): void {
    this.storage.removeItem('token');
    this.usernameSubject.next(null);
    this.router.navigate(['/']); // Redirect to home or login page
  }

  // Check if the user is authenticated (มี token และยังไม่หมดอายุ)
  isAuthenticated(): boolean {
    const token = this.storage.getItem('token');
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;
    // exp เป็นวินาที; ถ้า token ไม่มี exp ให้ถือว่าใช้ได้
    return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now();
  }

  // เช็ก role แบบไม่สนตัวพิมพ์เล็ก/ใหญ่ (ข้อมูลมีทั้ง 'admin' และ 'Admin')
  hasRole(role: string): boolean {
    return String(this.getRole() || '').toLowerCase() === role.toLowerCase();
  }

  // ล้าง token (ใช้เมื่อหมดอายุ/ใช้ไม่ได้) โดยไม่ redirect
  clearToken(): void {
    this.storage.removeItem('token');
    this.usernameSubject.next(null);
  }

  // Get the role of the user from the payload in localStorage
  getRole(): string | null {
   
    const token =this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      return payload?.user?.role||null;
    }
    return null;
  }
  getUsername():string |null{
    const token=this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      return payload?.user?.username||null;
    }
    return null;
  }
  getUserID(){
    const token=this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      return payload?.user?.User_ID || null;
    }
  }
  getFirstname(){
    const token=this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      return payload?.user?.User_Firstname || null;
    }
  }
  getUserImage(){
    const token=this.storage.getItem('token');
    if(token){
      const payload =this.decodeToken(token);
      return payload?.user?.User_image || null;
    }
  }
  // Decode JWT token
  private decodeToken(token: string):any{
    try{
      return jwtDecode(token);

    }catch(error){
      console.error('Failed to decode token',error);
      return null;
    }
  }

}
