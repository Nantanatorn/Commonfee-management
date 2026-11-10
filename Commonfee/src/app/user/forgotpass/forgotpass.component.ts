import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgotpass',
  templateUrl: './forgotpass.component.html',
  styleUrl: './forgotpass.component.css'
})
export class ForgotpassComponent {
  changePassForm: FormGroup;
  type: string = 'password';
  eyeIcon: string = 'bi bi-eye-slash fs-4';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router ) {
    this.changePassForm = this.fb.group({
      identifier: ['', Validators.required], // Identifier can be either email or username
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validator: this.checkPasswords });
  }

  ngOnInit(): void {}

  hideShowPass(): void {
    if (this.type === 'password') {
      this.type = 'text';
      this.eyeIcon = 'bi bi-eye fs-4';
    } else {
      this.type = 'password';
      this.eyeIcon = 'bi bi-eye-slash fs-4';
    }
  }

  checkPasswords(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { notSame: true };
  }

  // ขอรหัสยืนยัน 6 หลักทางอีเมล
  requestCode(): void {
    const identifier = this.changePassForm.get('identifier')?.value;
    if (!identifier) {
      Swal.fire({ title: 'ข้อมูลไม่ครบถ้วน!', text: 'กรุณากรอกชื่อผู้ใช้หรืออีเมลก่อน', icon: 'error' });
      return;
    }
    this.http.post('http://localhost:3500/forgotpass/request', { identifier }).subscribe({
      next: () => Swal.fire({ title: 'ส่งรหัสแล้ว', text: 'หากบัญชีนี้มีอยู่ ระบบได้ส่งรหัสยืนยันไปทางอีเมลแล้ว (ใช้ได้ 10 นาที)', icon: 'success' }),
      error: (error) => Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: error?.error?.message || 'กรุณาลองใหม่อีกครั้ง', icon: 'error' })
    });
  }

  onChange(): void {
    if (this.changePassForm.valid) {
      const { identifier, code, password } = this.changePassForm.value;
      const formData = { identifier, code, password };

      this.http.put('http://localhost:3500/updatepass', formData).subscribe({
        next: (response) => {
          Swal.fire({
            title: "สำเร็จ!",
            text: 'Password updated successfully.',
            icon: "success"
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: error?.error?.message || 'กรุณาลองใหม่อีกครั้ง',
            icon: 'error'
          });
          console.error('Error ', error);
        }
      });
    } else {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน!',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        icon: 'error'
      });
    }
  }
}
