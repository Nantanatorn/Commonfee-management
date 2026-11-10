import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2'; 
import { RegisterService } from '../../service/register.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { House, Resident } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';


@Component({
  selector: 'app-resident-list',
  templateUrl: './resident-list.component.html',
  styleUrl: './resident-list.component.css'
})
export class ResidentListComponent implements OnInit {
  isModalOpen: boolean = false;
  registerForm!: FormGroup;
  editForm!: FormGroup;
  isEditOpen: boolean = false;
  private editingId: number | null = null;
  private residentsSubject = new BehaviorSubject<Resident[]>([]);
  residents$: Observable<Resident[]> = this.residentsSubject.asObservable();
  House$: Observable<House[]>;
  searchQuery: string = '';
  private activeSearch: string = ''; // คำค้นหาที่ใช้อยู่ (เปลี่ยนเมื่อกดค้นหาเท่านั้น ไม่ใช่ทุกครั้งที่พิมพ์)

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private banservice: BanDeeService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      IDcard: ['', [Validators.required, Validators.maxLength(13)]],
      User_Firstname: ['', [Validators.required, Validators.maxLength(50)]],
      User_Lastname: ['', [Validators.required, Validators.maxLength(50)]],
      username: ['', [Validators.required, Validators.maxLength(50)]],
      House_number: [null, Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.maxLength(50)]],
    });

    this.editForm = this.fb.group({
      User_Firstname: ['', [Validators.required, Validators.maxLength(50)]],
      User_Lastname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
    });

    // Load initial residents data with pagination
    this.loadResidentsData(this.currentPage, this.pageSize);
    this.House$ = this.banservice.getEmptyHouse();
  }

  // Method to load residents data with pagination
  loadResidentsData(page: number, limit: number): void {
    this.banservice.pageresident(page, limit, this.activeSearch).subscribe({
      next: (response) => {
        this.residentsSubject.next(response.data);
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
      },
      error: (error) => {
        console.error('Error loading residents:', error);
      },
    });
  }

  // Pagination methods
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadResidentsData(this.currentPage, this.pageSize);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadResidentsData(this.currentPage, this.pageSize);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadResidentsData(this.currentPage, this.pageSize);
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.registerForm.reset();
  }

  onSubmit(): void {
    console.log('Form submit triggered');
    if (this.registerForm.valid) {
      console.log('Form data:', this.registerForm.value);
      this.registerService.registerUser(this.registerForm.value).subscribe(
        (response: any) => {
          // Refresh residents data after registration
          this.loadResidentsData(this.currentPage, this.pageSize);
          this.House$ = this.banservice.getEmptyHouse();
          this.closeModal();
          Swal.fire({
            title: 'ลงทะเบียนเสร็จสิ้น!',
            text: response?.emailSent === false
              ? `ส่งอีเมลไม่สำเร็จ กรุณาแจ้งรหัสผ่านชั่วคราวให้ลูกบ้าน: ${response.tempPassword}`
              : 'ระบบส่งรหัสผ่านชั่วคราวไปที่อีเมลของลูกบ้านแล้ว',
            icon: 'success',
          });
          console.log('Registration successful', response);
        },
        (error) => {
          Swal.fire({
            title: 'ลงทะเบียนไม่สำเร็จ',
            text: error?.error?.message || 'กรุณาตรวจสอบEmail ของท่าน และ เลขที่บ้าน',
            icon: 'error',
          });
          console.error('Registration error', error);
        }
      );
      this.registerForm.reset();
    } else {
      Swal.fire({
        title: 'กรอกข้อมูลไม่ถูกต้อง',
        text: 'form is invalid',
        icon: 'error',
      });
      console.log('Form is invalid');
    }
  }

  isLiving(r: Resident): boolean {
    return (r.status || '').trim() === 'Living';
  }

  openEdit(r: Resident): void {
    this.editingId = r.R_ID;
    this.editForm.reset({
      User_Firstname: r.R_Firstname,
      User_Lastname: r.R_Lastname,
      email: r.email,
      phone: (r.phone || '').trim(),
    });
    this.isEditOpen = true;
  }

  closeEdit(): void {
    this.isEditOpen = false;
    this.editingId = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.editingId === null) {
      this.editForm.markAllAsTouched();
      Swal.fire({
        title: 'กรอกข้อมูลไม่ถูกต้อง',
        text: 'กรุณากรอกชื่อ นามสกุล อีเมล และเบอร์โทร (ตัวเลข 9-10 หลัก) ให้ครบถ้วน',
        icon: 'error',
      });
      return;
    }
    this.banservice.updateResident(this.editingId, this.editForm.value).subscribe({
      next: (res) => {
        this.closeEdit();
        this.loadResidentsData(this.currentPage, this.pageSize);
        Swal.fire({ title: 'สำเร็จ!', text: res.message, icon: 'success' });
      },
      error: (err) => {
        Swal.fire({ title: 'แก้ไขไม่สำเร็จ', text: err?.error?.message || 'กรุณาลองใหม่อีกครั้ง', icon: 'error' });
      },
    });
  }

  moveOut(r: Resident): void {
    Swal.fire({
      title: 'ยืนยันการย้ายออก?',
      html: `${r.R_Firstname} ${r.R_Lastname}<br>บ้านเลขที่ ${(r.House_number || '').trim()} จะกลับเป็นสถานะว่าง<br>บัญชียังเข้าดูประวัติเก่าได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ย้ายออก',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.banservice.moveOutResident(r.R_ID).subscribe({
        next: (res) => {
          this.loadResidentsData(this.currentPage, this.pageSize);
          this.House$ = this.banservice.getEmptyHouse();
          Swal.fire({ title: 'สำเร็จ!', text: res.message, icon: 'success' });
        },
        error: (err) => {
          Swal.fire({ title: 'ย้ายออกไม่ได้', text: err?.error?.message || 'กรุณาลองใหม่อีกครั้ง', icon: 'error' });
        },
      });
    });
  }

  searchresident() {
    // ค้นหาฝั่งเซิร์ฟเวอร์ แล้วกลับไปหน้า 1 (ช่องว่าง = แสดงทั้งหมด)
    this.activeSearch = this.searchQuery.trim();
    this.currentPage = 1;
    this.loadResidentsData(this.currentPage, this.pageSize);
  }
}
