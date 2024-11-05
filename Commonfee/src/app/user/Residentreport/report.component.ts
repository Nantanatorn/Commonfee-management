import { Component, Input } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PetitionHistory } from '../../model/model';
import { AuthService } from '../../service/auth.service';
import { BanDeeService } from '../../service/ban-dee.service';


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent  {
  
  petitionHistory$! : Observable<PetitionHistory[]>
  reportForm!: FormGroup;

  constructor(private http: HttpClient , 
              private authService : AuthService , 
              private banDeeService: BanDeeService,
              private fb: FormBuilder,
              private route : Router,){}
  ngOnInit(): void {
    
    this.reportForm = this.fb.group({
      petition_Title: ['',Validators.required],
      petition_Type:[null,Validators.required],
      petition_detail: ['', Validators.required]
    });
    const token = localStorage.getItem('token');
    if (token) {
     
      this.petitionHistory$ = this.banDeeService.getPetitionUser(token);
    } else {
      console.error('No token found. Please login first.');
    }
    
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
         
        }
      });
    }
  }

  onSubmit(): void {

    if (this.reportForm.valid) {
      console.log('Form data', this.reportForm.value);
  
      // ดึง token จาก localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire({
          title: "ไม่มีการยืนยันตัวตน!",
          text: "กรุณาเข้าสู่ระบบก่อนทำการส่งคำร้อง",
          icon: "warning"
        });
        return;
      }
  
      // สร้าง header สำหรับการส่ง token
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      // ส่งคำร้องไปยัง API (ระบุ responseType: 'text' เพื่อให้ Angular เข้าใจว่า response จะเป็นข้อความ)
      this.http.post('http://localhost:3500/petition', this.reportForm.value, { headers, responseType: 'text' }).subscribe({
        next: (response) => {
          console.log('Successfully:', response);
          Swal.fire({
            title: "ส่งคำร้องเสร็จสิ้น!",
            text: "เราได้รับคำร้องของคุณไว้แล้ว!",
            icon: "success"
          });
          
          this.petitionHistory$ = this.banDeeService.getPetitionUser(token);

        },
        error: (error) => {
          console.error('Error:', error);
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: "ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง",
            icon: "error"
          });
        }
      });
    } else {
      Swal.fire({
        title: "ข้อมูลไม่ครบถ้วน!",
        text: "กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่งคำร้อง",
        icon: "warning"
      });
    }
   
  }
}