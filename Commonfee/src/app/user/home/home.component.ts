import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  Announcements : Observable<Announcement[]> | undefined;
  

  constructor(private banservice : BanDeeService,private http: HttpClient, private authService: AuthService
    ,private route : Router,
              
  ){}

  ngOnInit(): void{
    this.Announcements = this.banservice.getAllAnnouncement();
    const token = localStorage.getItem('token');
    if (token) {
      this.banservice.getPaymentHistory(token).subscribe({
        next: (response: any) => {
          console.log('API Response:', response);
          // ตรวจสอบว่า response มีข้อมูลและ Pay_Status เป็น "Overdue"
          if (response && response[0] && response[0].Pay_Status.trim() === 'Overdue') {
            console.log('Status is Overdue, showing alert');
            Swal.fire({
              title: 'คุณมียอดค้างชำระ',
              text: 'คุณค้างชำระค่าส่วนกลาง โปรดดำเนินการให้เสร็จสิ้น!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'ชำระเงิน'
            }).then((result) => {
              if (result.isConfirmed) {
                this.route.navigate(['/purchase']);
              }
            });
          }
        },
        error: (err) => {
          // จัดการเมื่อเกิดปัญหาในการเรียก API
          console.error('Error fetching payment history:', err);
          
        }
      });
    }
  }
}
