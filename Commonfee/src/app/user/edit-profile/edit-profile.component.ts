import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BanDeeService } from '../../service/ban-dee.service';
import { AuthService } from '../../service/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Userinfo } from '../../model/user';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  changePassForm: FormGroup;
  selectedFile: File | null = null;
  profileForm: FormGroup;
  type: string = 'password';
  eyeIcon: string = 'bi bi-eye-slash fs-4';

  constructor(private fb: FormBuilder,
              private http: HttpClient, 
              private authService: AuthService, 
              private banDeeService: BanDeeService) {
  
    this.profileForm = this.fb.group({
      User_Firstname: ['', [Validators.required, Validators.maxLength(50)]],
      User_Lastname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.maxLength(10)]],
      User_image: [null]
    });
    this.changePassForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.checkPasswords });
    
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.banDeeService.getUserinfo(token).subscribe({
        next: (userInfo: Userinfo[]) => {
          console.log('User info received:', userInfo);
          if (userInfo.length > 0) {
            this.profileForm.patchValue({
              User_Firstname: userInfo[0].User_Firstname,
              User_Lastname: userInfo[0].User_Lastname,
              email: userInfo[0].email,
              phone: userInfo[0].phone,
            });
          }
        },
        error: (err) => {
          console.error('Error fetching user info:', err);
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
            icon: 'error',
          });
        }
      });
    } else {
      Swal.fire({
        title: 'ไม่พบ Token!',
        text: 'กรุณาเข้าสู่ระบบอีกครั้ง',
        icon: 'warning',
      });
    }

  }
  saveProfile() {
    if (this.profileForm.valid) {
        const formData = new FormData();
        formData.append('User_Firstname', this.profileForm.get('User_Firstname')?.value);
        formData.append('User_Lastname', this.profileForm.get('User_Lastname')?.value);
        formData.append('email', this.profileForm.get('email')?.value);
        formData.append('phone', this.profileForm.get('phone')?.value);
        
        // ถ้าผู้ใช้เลือกไฟล์รูปภาพ ให้เพิ่มรูปภาพใน FormData
        if (this.selectedFile) {
            formData.append('User_image', this.selectedFile);
        }
        
        // ดึง Token เพื่อใช้อัปเดตข้อมูล
        const token = localStorage.getItem('token');
        if (token) {
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            
            this.http.put('http://localhost:3500/updateprofile', formData, { headers }).subscribe({
                next: (response) => {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'Profile updated!',
                        icon: 'success'
                    });
                },
                error: (err) => {
                    console.error('Error updating profile:', err);
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด!',
                        text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                        icon: 'error'
                    });
                }
            });
        } else {
            Swal.fire({
                title: 'ไม่พบ Token!',
                text: 'กรุณาเข้าสู่ระบบอีกครั้ง',
                icon: 'warning',
            });
        }
    }
}
  resetForm(){
    this.profileForm.reset();
    this.selectedFile = null;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาอัปโหลดไฟล์ที่เป็น .jpeg หรือ .png เท่านั้น');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // จำกัดขนาดไฟล์ไม่เกิน 5MB
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      this.selectedFile = file;
    }
  }

  hideShowPass(): void {
    if (this.type === 'password') {
      this.type = 'text';
      this.eyeIcon = 'bi bi-eye fs-4';
    } else {
      this.type = 'password';
      this.eyeIcon = 'bi bi-eye-slash fs-4';
    }
  }

  onChange() {
    if (this.changePassForm.valid) {
      const formData = {
        password: this.changePassForm.get('password')?.value
      };
      const token = localStorage.getItem('token');
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.put('http://localhost:3500/changepassbytoken', formData, { headers }).subscribe({
          next: (response) => {
            Swal.fire({
              title: 'สำเร็จ!',
              text: 'Password updated successfully.',
              icon: 'success'
            });
          },
          error: (err) => {
            console.error('Error updating password:', err);
            Swal.fire({
              title: 'เกิดข้อผิดพลาด!',
              text: 'ไม่สามารถบันทึกรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง',
              icon: 'error'
            });
          }
        });
      } else {
        Swal.fire({
          title: 'ไม่พบ Token!',
          text: 'กรุณาเข้าสู่ระบบอีกครั้ง',
          icon: 'warning',
        });
      }
    } else {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน!',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        icon: 'error',
      });
    }
  }
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }
}