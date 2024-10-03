import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { RegisterService } from '../../../register.service';
import { Route, Router } from '@angular/router';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit{
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private registerService: RegisterService, private router:Router) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.maxLength(10)]],
      username: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      picture: [''],
      password: ['', [Validators.required, Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(50)]]
    }, { validators: this.passwordMatchValidator });
  }

  gologin() {
    this.router.navigate(['/']);
  }
  onSubmit(): void {
    console.log('Form submit triggered');
    if (this.registerForm.valid) {
      console.log('Form data:', this.registerForm.value);

      // ส่งข้อมูลไปยังเซิร์ฟเวอร์
      this.registerService.registerUser(this.registerForm.value).subscribe(
        response => {
          Swal.fire({
            title: "สมัคร สำเร็จ!",
            text: "sign up successful",
            icon: "success"
          });
          console.log('Registration successful', response);
          this.router.navigate(['']);
          
        },
        error => { 
          Swal.fire({
          title: "สมัคร ไม่สำเร็จ",
          text: "sign up failed",
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

  // Custom validator to match password and confirmPassword
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }
  onFileChange(event: Event){
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length){

      this.registerForm.patchValue({
        picture : input.files[0].name
      })
    }
  }

}
