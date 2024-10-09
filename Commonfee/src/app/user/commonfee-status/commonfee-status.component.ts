import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-commonfee-status',
  templateUrl: './commonfee-status.component.html',
  styleUrl: './commonfee-status.component.css'
})
export class CommonfeeStatusComponent implements OnInit{
  selectedMonth: string = ''; // เก็บค่าวันที่ที่ถูกเลือก
  months: string[] = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
  statusList = [
    { houseNumber: '001', owner: 'A', isPaid: false, dueAmount: 1500, paidAmount: 0, paymentDate: null },
    { houseNumber: '002', owner: 'B', isPaid: true, dueAmount: 1500, paidAmount: 1500, paymentDate: '2024-10-01' },
    { houseNumber: '003', owner: 'C', isPaid: false, dueAmount: 1200, paidAmount: 0, paymentDate: null },
    { houseNumber: '004', owner: 'D', isPaid: true, dueAmount: 1200, paidAmount: 1200, paymentDate: '2024-09-15' }
  ];
  
  filteredStatus = [...this.statusList]; // เริ่มต้นให้แสดงข้อมูลทั้งหมด

  constructor() {}

  ngOnInit(): void {
    this.filterByMonth(); // เรียกใช้งานการกรองเมื่อโหลดครั้งแรก
  }

  // ฟังก์ชันสำหรับกรองข้อมูลตามเดือนที่เลือก
  filterByMonth(): void {
    if (this.selectedMonth === '') {
      this.filteredStatus = [...this.statusList]; // หากไม่ได้เลือกเดือน แสดงข้อมูลทั้งหมด
    } else {
      // ตัวอย่างการกรองข้อมูลตามวันที่
      this.filteredStatus = this.statusList.filter(status => {
        const paymentDate = status.paymentDate ? new Date(status.paymentDate) : null;
        return paymentDate && paymentDate.toLocaleString('th-TH', { month: 'long' }) === this.selectedMonth;
      });
    }
  }

  // ฟังก์ชันสำหรับการชำระเงิน
  payFee(status: any): void {
    // อัปเดตสถานะการชำระเงิน
    status.isPaid = true;
    status.paidAmount = status.dueAmount;
    status.paymentDate = new Date().toISOString().split('T')[0]; // กำหนดวันที่ชำระเป็นวันนี้

    // อัปเดต filteredStatus ใหม่หลังจากชำระเงิน
    this.filterByMonth();

    // แสดงข้อความยืนยัน (คุณสามารถใช้ sweetalert หรืออื่นๆ)
    alert(`บ้านเลขที่ ${status.houseNumber} ชำระเงินเรียบร้อยแล้ว`);
  }
}