import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2'; 
import { RegisterService } from '../../service/register.service';
import { Router } from '@angular/router';
import { response } from 'express';
import { BehaviorSubject, Observable } from 'rxjs';
import { House, Resident } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-resident-list',
  templateUrl: './resident-list.component.html',
  styleUrl: './resident-list.component.css'
})
export class ResidentListComponent implements OnInit {
  isModalOpen: boolean = false;
  registerForm!: FormGroup;
  private residentsSubject = new BehaviorSubject<Resident[]>([]);
  residents$: Observable<Resident[]> = this.residentsSubject.asObservable();
  House$: Observable<House[]>;
  searchQuery: string = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 8;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private banservice: BanDeeService,
    private http: HttpClient
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

    // Load initial residents data with pagination
    this.loadResidentsData(this.currentPage, this.pageSize);
    this.House$ = this.banservice.getEmptyHouse();
  }

  // Method to load residents data with pagination
  loadResidentsData(page: number, limit: number): void {
    this.banservice.pageresident(page, limit).subscribe({
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
        (response) => {
          // Refresh residents data after registration
          this.loadResidentsData(this.currentPage, this.pageSize);
          this.closeModal();
          Swal.fire({
            title: 'ลงทะเบียนเสร็จสิ้น!',
            text: 'sign up successful',
            icon: 'success',
          });
          console.log('Registration successful', response);
        },
        (error) => {
          Swal.fire({
            title: 'ลงทะเบียนไม่สำเร็จ',
            text: 'กรุณาตรวจสอบEmail ของท่าน และ เลขที่บ้าน',
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

  searchresident() {
    console.log(`Searching for Member: ${this.searchQuery}`);
    
    if (this.searchQuery.trim() === '') {
      // ถ้าช่องค้นหาว่างเปล่า ให้โหลดข้อมูลทั้งหมด
      this.loadResidentsData(this.currentPage, this.pageSize);
    } else {
      // ถ้าไม่ว่าง ให้ค้นหาข้อมูลตามคำค้นหา
      this.http
        .get<Resident[]>(`http://localhost:3500/searchresident?search=${this.searchQuery}`)
        .subscribe({
          next: (response: Resident[]) => {
            console.log('Search result:', response);
            this.residentsSubject.next(response);
          },
          error: (error) => {
            console.error('Error fetching residents:', error);
          },
        });
    }
  }
}