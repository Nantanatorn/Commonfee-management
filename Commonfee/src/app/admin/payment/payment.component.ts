import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {

  residents = [
    { houseNumber: 1, name: 'นายสมชาย' , hasResident: true },
    { houseNumber: 2, name: 'นางสมศรี' , hasResident: true },
    { houseNumber: 3, name: 'นายจิตร', hasResident: true  },
    { houseNumber: 4, name: 'นางสมฤดี' , hasResident: true },
    { houseNumber: 5, name: 'นายกำธร' , hasResident: true },
    { houseNumber: 6, name: 'นางสาวกาญจนา', hasResident: true  }
    // เพิ่มข้อมูลบ้านได้ตามต้องการ
  ];
  editFee : FormGroup
  isModalOpen: boolean = false;

  constructor(private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router, ){

    this.editFee = this.fb.group({
      Announce_Title: ['', Validators.required],
      FeeRate: ['', Validators.required]
       });
    }


  getResidentInfo(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    return resident ? `บ้านเลขที่ ${houseNumber}, ผู้อยู่อาศัย: ${resident.name}` : `บ้านเลขที่ ${houseNumber}, ไม่มีข้อมูลผู้อยู่อาศัย`;
  }

     // เปิด modal
     openModal() {
      this.isModalOpen = true;
    }
  
    // ปิด modal
    closeModal() {
      this.isModalOpen = false;
      
    }
  
    onSubmit(){

    }

}
