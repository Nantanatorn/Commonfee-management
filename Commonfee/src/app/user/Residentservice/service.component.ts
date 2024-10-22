import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BanDeeService } from '../../service/ban-dee.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  services: any[] = [];

  constructor(private http: HttpClient,private route : Router,private banDeeService : BanDeeService,) {}

  ngOnInit() {
    this.loadServices();
    const token = localStorage.getItem('token');
    if (token) {
      this.banDeeService.getPaymentHistory(token).subscribe({
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
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถโหลดข้อมูลการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
            icon: 'error'
          });
        }
      });
    }
  }

  loadServices() {
    this.http.get<any>('http://your-backend-url/api/services')
      .subscribe(data => {
        this.services = data;
      }, error => console.error('Could not load services!', error));
  }

  getDetails(id: number) {
    // เรียก API เพื่อดูรายละเอียดบริการ
    this.http.get<any>(`http://your-backend-url/api/services/${id}`)
      .subscribe(detail => {
        console.log('Service Details: ', detail);
      }, error => console.error('Could not load service details!', error));
  }
}
