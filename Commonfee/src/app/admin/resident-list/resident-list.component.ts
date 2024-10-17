import { Component } from '@angular/core';
import Swal from 'sweetalert2'; 


@Component({
  selector: 'app-resident-list',
  templateUrl: './resident-list.component.html',
  styleUrl: './resident-list.component.css'
})
export class ResidentListComponent {
  isModalOpen: boolean = false;

  user = {
    idCard: '',
    firstName: '',
    lastName: '',
    houseNo: '',
    phone: '',
  };

  // เปิด Modal
  openModal() {
    this.isModalOpen = true;
  }

  // ปิด Modal
  closeModal() {
    this.isModalOpen = false;
  }

  // ฟังก์ชันสำหรับบันทึกข้อมูล พร้อมตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
  onSubmit(registerForm: any) {
    if (this.user.idCard.trim() && this.user.firstName.trim() && this.user.lastName.trim() && this.user.houseNo.trim() && this.user.phone.trim()) {
      console.log('ข้อมูลผู้สมัคร:', this.user);
      // คุณสามารถทำการบันทึกข้อมูลหรือส่งข้อมูลไปยัง backend ได้ที่นี่
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        this.closeModal();
        this.resetForm();
      });
    } else {
      Swal.fire({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        icon: 'info',
        confirmButtonText: 'ตกลง'
      });
    }
  }

  // ฟังก์ชันสำหรับล้างข้อมูลในฟอร์ม
  resetForm() {
    this.user = {
      idCard: '',
      firstName: '',
      lastName: '',
      houseNo: '',
      phone: '',
    };
  }
}