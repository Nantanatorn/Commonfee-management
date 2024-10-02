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

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    // สร้าง FormGroup พร้อม Validators
    this.reportForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      houseID: ['', Validators.required],
      reportDate: ['', Validators.required],
      detail: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.reportForm.valid) {
      Swal.fire({
        icon: 'question',
        title: 'คุณแน่ใจใช่ไหมว่าจะร้องเรียน',
        html: 'กรุณาตรวจสอบรายละเอียดคำร้องเรียน<br/>ยืนยันคำร้องเรียนสำเร็จ',
        showConfirmButton: true,
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire("บันทึกคำร้องเรียน", "", "success");
        } else {
          Swal.fire("ยกเลิกคำร้องเรียน", "", "error");
        }
      });
    } else {
      // mark ทุกฟิลด์ว่า touched เพื่อแสดง error
      Object.keys(this.reportForm.controls).forEach((key) => {
        const control = this.reportForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
}
