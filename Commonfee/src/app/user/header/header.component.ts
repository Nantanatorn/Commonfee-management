import { AuthService } from './../../service/auth.service';
import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import Swal from 'sweetalert2'; 
import { Router } from '@angular/router';
import { BehaviorSubject, observable, Observable } from 'rxjs';
import { Users } from '../../model/model';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] // แก้ไขจาก styleUrl เป็น styleUrls เพื่อให้ถูกต้อง
})
export class HeaderComponent implements OnInit {
  isDarkMode: boolean = false;
  isProfilePopupVisible = false;
  user = new BehaviorSubject<Users[]>([]);
  username: string | null = null;
  firstname : string | null = null;
  picture: string | null;
  USER_ID : number | null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private router: Router,
    private authService : AuthService
  ) {}

  ngOnInit(): void {
    // Logic ที่คุณต้องการใส่ใน ngOnInit (ถ้าไม่มีอะไรต้องการทำ ก็เว้นว่างได้)
    if (isPlatformBrowser(this.platformId)) {
      this.username = this.authService.getUsername();
      this.USER_ID = this.authService.getUserID();
      this.firstname = this.authService.getFirstname();

      // ตรวจสอบว่ามีการเรียกใช้งาน localStorage ได้หรือไม่
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        this.isDarkMode = true;
        this.renderer.addClass(document.body, 'dark-mode');
      } else {
        this.isDarkMode = false;
        this.renderer.removeClass(document.body, 'dark-mode');
      }
      this.updateNavbarColor();
      this.updateProfilePopupBackground();
  }
}
  
  logout(): void {
    // ตรวจสอบว่ากำลังทำงานในเบราว์เซอร์
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      this.router.navigate(['/']);
    }
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
      this.updateNavbarColor();
      this.updateProfilePopupBackground(); 
    }
  }
  updateNavbarColor(): void {
    const navbar = document.querySelector('.navbar') as HTMLElement;
    if (navbar) {
      if (this.isDarkMode) {
        navbar.style.background = 'linear-gradient(120deg, #5b2c6f, #000)';
      } else {
        navbar.style.background = 'linear-gradient(145deg, #9a8fff, #c68ef8, #fb90cd)';
      }
    }
  }
  toggleProfilePopup(): void {
    this.isProfilePopupVisible = !this.isProfilePopupVisible;

    // ดึง element profilePopup ให้แน่ใจว่าอยู่ใน DOM
    const profilePopup = document.getElementById('profilePopup') as HTMLElement;
    if (profilePopup) {
      if (this.isProfilePopupVisible) {
        // แสดง profile popup
        profilePopup.style.display = 'block';

        // ตรวจสอบว่าโหมดมืดหรือสว่างและเปลี่ยนสีพื้นหลัง popup
        this.updateProfilePopupBackground();
      } else {
        // ซ่อน profile popup
        profilePopup.style.display = 'none';
      }
    } else {
      console.error("Element 'profilePopup' not found in DOM");
    }
  }
  updateProfilePopupBackground(): void {
    const profilePopup = document.getElementById('profilePopup') as HTMLElement;
    if (profilePopup) {
      if (this.isDarkMode) {
        // เปลี่ยนเป็นสีโหมดมืด
        profilePopup.style.background = 'linear-gradient(120deg, #5b2c6f, #000)';
      } else {
        // เปลี่ยนเป็นสีโหมดสว่าง
        profilePopup.style.background = 'linear-gradient(145deg, #9a8fff, #c68ef8, #fb90cd)';
      }
    } else {
      console.error("Element 'profilePopup' not found in DOM when updating background");
    }
  }
  editProfile(): void {
    this.router.navigate(['/edit-profile']);
  }
  refresh(): void {
    window.location.reload();
  }
}
