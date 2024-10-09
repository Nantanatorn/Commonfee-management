import { jsPDF } from 'jspdf';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  [x: string]: any;
  showHeader = true;
  isLoginPage: boolean;
  isregisterPage: boolean;
  isAdminPage: boolean;
  isHomeUserPage:boolean;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // ตรวจสอบ URL เพื่อตั้งค่า isLoginPage, isRegisterPage และ isAdminPage
        this.isLoginPage = this.router.url.includes('/login');
        this.isregisterPage = this.router.url.includes('/register');
        this.isHomeUserPage = this.router.url.includes('/home');
        this.isAdminPage = this.router.url.includes('/adminsidebar') || 
                           this.router.url.includes('/adminlogin') || 
                           this.router.url.includes('/dashboard')  ||
                           this.router.url.includes('/payment') || 
                           this.router.url.includes('/residentList') || 
                           this.router.url.includes('/complainRepair') || 
                           this.router.url.includes('/adminstatus');
        this.checkHeaderVisibility();
      }
    });
  }

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.checkHeaderVisibility();
    });
  }

  checkHeaderVisibility(): void {
    const currentRoute = this.router.url;
    this.showHeader = !(
      currentRoute.includes('adminsidebar') || 
      this.router.url.includes('/adminhome') || 
      currentRoute.includes('adminlogin') || 
      this.router.url.includes('/dashboard')  ||
      this.router.url.includes('/payment') || 
      this.router.url.includes('/residentList') || 
      this.router.url.includes('/complainRepair') || 
      currentRoute.includes('adminstatus') || 
      currentRoute.includes('login') || 
      currentRoute.includes('register')
    );
  }
}
