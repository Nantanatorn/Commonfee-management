import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import Swal from 'sweetalert2'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] // แก้ไขจาก styleUrl เป็น styleUrls เพื่อให้ถูกต้อง
})
export class HeaderComponent implements OnInit {
  isDarkMode: boolean = false;


  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Logic ที่คุณต้องการใส่ใน ngOnInit (ถ้าไม่มีอะไรต้องการทำ ก็เว้นว่างได้)
    if (isPlatformBrowser(this.platformId)) {
      console.log('Running on the browser');
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
        this.router.navigate(['/login']);
        console.log('User logged out');
      }
    });
  }
  toggleDarkMode(): void {
    // ตรวจสอบว่ากำลังทำงานในเบราว์เซอร์
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        this.renderer.addClass(document.body, 'dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark-mode');
        localStorage.setItem('theme', 'light');
      }
      // อัปเดตสีพื้นหลังของ navbar และ profile popup
      this.updateNavbarColor();
    }
  }
  updateNavbarColor(): void {
    const navbar = document.querySelector('.nav') as HTMLElement;
    if (navbar) {
      if (this.isDarkMode) {
        navbar.style.background = 'linear-gradient(120deg, #5b2c6f, #000)';
      } else {
        navbar.style.background = 'linear-gradient(145deg, #9a8fff, #c68ef8, #fb90cd)';
      }
    }
  }
}
