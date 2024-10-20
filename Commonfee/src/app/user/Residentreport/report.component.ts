import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  reportForm!: FormGroup;
  currentDate: string;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http : HttpClient
  ) {}

  ngOnInit(): void {
    // สร้าง FormGroup พร้อม Validators
    this.reportForm = this.fb.group({
      petition_Title: ['',Validators.required],
      petition_Type:[null,Validators.required],
      petition_detail: ['', Validators.required]
    });
    const today = new Date();
    this.currentDate = today.toISOString().substring(0, 10);
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
