import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent implements OnInit{
  isDarkMode: boolean = false;
  isOpen = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,private router:Router,private authService: AuthService,
    private renderer: Renderer2
  ) {}


  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem('sidebarOpen');
      this.isOpen = savedState === 'true'; // โหลดค่าเปิด/ปิดจาก localStorage
  
      const savedTheme = localStorage.getItem('isDarkMode');
      this.isDarkMode = savedTheme === 'true'; // โหลดสถานะ dark mode
      this.applyTheme();
    }
  }
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    console.log('Sidebar isOpen:', this.isOpen); // ดูว่าค่าถูกเปลี่ยนจริงหรือไม่
    localStorage.setItem('sidebarOpen', this.isOpen.toString());
  }
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isDarkMode', String(this.isDarkMode));
    }
  }

  applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDarkMode) {
        this.renderer.addClass(document.body, 'dark-mode');
        this.renderer.removeClass(document.body, 'light-mode');
      } else {
        this.renderer.addClass(document.body, 'light-mode');
        this.renderer.removeClass(document.body, 'dark-mode');
      }
      console.log('Theme applied:', this.isDarkMode ? 'dark-mode' : 'light-mode');
    }
  }

 
  logout(): void {
    Swal.fire({
      title: 'คุณต้องการออกจากเว็บไซต์ใช่ไหม?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        // ลบข้อมูลหรือ token เพื่อทำการ logout (ถ้ามี)
        localStorage.removeItem('userToken'); 
        
        // นำทางไปยังหน้า login
        // นำทางไปยังหน้า login
        this.router.navigate(['/login']);
        console.log('User logged out');
      }
    });
  }

}