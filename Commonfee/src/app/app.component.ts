import { jsPDF } from 'jspdf';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BanDeeService } from './service/ban-dee.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './service/auth.service';
import { response } from 'express';
import Swal from 'sweetalert2';

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
  adminSide:boolean;

  constructor(private router: Router,
    ) {
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
        this.adminSide = this.router.url.includes('/dashboard') || 
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
