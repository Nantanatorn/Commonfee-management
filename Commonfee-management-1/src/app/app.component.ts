import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showHeader = true;
  isLoginPage: boolean;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // ตรวจสอบ URL เพื่อตั้งค่า isLoginPage สำหรับหน้า login
        this.isLoginPage = this.router.url.includes('/login');
      }
    });
  }

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      
      this.showHeader = !(currentRoute.includes('login') || currentRoute.includes('register'));
    });
  }
}
