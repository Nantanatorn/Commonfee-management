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

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // ตรวจสอบ URL เพื่อตั้งค่า isLoginPage, isRegisterPage และ isAdminPage
        this.isLoginPage = this.router.url.includes('/login');
        this.isregisterPage = this.router.url.includes('/register');
        this.isAdminPage = this.router.url.includes('/adminsidebar') || 
                           this.router.url.includes('/adminlogin') || 
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
      currentRoute.includes('adminlogin') || 
      currentRoute.includes('adminstatus') || 
      currentRoute.includes('login') || 
      currentRoute.includes('register')
    );
  }
}
