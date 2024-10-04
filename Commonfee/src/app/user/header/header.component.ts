import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import Swal from 'sweetalert2'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    throw new Error('Method not implemented.');
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
}
