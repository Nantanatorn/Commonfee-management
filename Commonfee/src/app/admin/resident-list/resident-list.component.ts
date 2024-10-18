import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2'; 
import { RegisterService } from '../../service/register.service';
import { Router } from '@angular/router';
import { response } from 'express';


@Component({
  selector: 'app-resident-list',
  templateUrl: './resident-list.component.html',
  styleUrl: './resident-list.component.css'
})
export class ResidentListComponent implements OnInit {
  isModalOpen: boolean = false;
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private registerService: RegisterService, private router:Router) { }

  ngOnInit(): void {
      this.registerForm = this.fb.group({
        IDcard: ['', [Validators.required, Validators.maxLength(13)]],
        User_Firstname: ['', [Validators.required, Validators.maxLength(50)]],
        User_Lastname: ['', [Validators.required, Validators.maxLength(50)]],
        House_number: ['', [Validators.required, Validators.maxLength(5)]],
        phone: ['', [Validators.required, Validators.maxLength(10)]],
        email: ['', [Validators.required, Validators.maxLength(50)]],
      })
  }
  // เปิด Modal
  openModal() {
    this.isModalOpen = true;
  }
  // ปิด Modal
  closeModal() {
    this.isModalOpen = false;
    this.registerForm.reset();
  }

  onSubmit(): void {
    console.log('Form submit triggered');
    if (this.registerForm.valid) {
      console.log('Form data:', this.registerForm.value);

      // ส่งข้อมูลไปยังเซิร์ฟเวอร์
      this.registerService.registerUser(this.registerForm.value).subscribe(
        response => {
          this.closeModal();
          Swal.fire({
            title: "ลงทะเบียนเสร็จสิ้น!",
            text: "sign up successful",
            icon: "success"
          });
          console.log('Registration successful', response);
          
          // this.router.navigate(['']);
          
        },
        error => { 
          Swal.fire({
          title: "ลงทะเบียนไม่สำเร็จ",
          text: "กรุณาตรวจสอบerror",
          icon: "error"
        });
          console.error('Registration error', error);
        }
      );
      this.registerForm.reset();
    } else {
      Swal.fire({
        title: "กรอกข้อมูลไม่ถูกต้อง",
        text: "form is invalid",
        icon: "error"})
      console.log('Form is invalid');
    }
  }
}