import { Component, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-side-service',
  templateUrl: './side-service.component.html',
  styleUrl: './side-service.component.css'
})
export class SideServiceComponent implements OnInit {
  isSidebarOpen: boolean = true; // ค่าเริ่มต้นให้ Sidebar เปิดอยู่

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {}

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen; // สลับการเปิด-ปิด Sidebar
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

