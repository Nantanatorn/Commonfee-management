import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  residents = [
    { houseNumber: 1, name: 'นายสมชาย' },
    { houseNumber: 2, name: 'นางสมศรี' },
    { houseNumber: 3, name: 'นายจิตร' },
    { houseNumber: 4, name: 'นางสมฤดี' },
    { houseNumber: 5, name: 'นายกำธร' },
    { houseNumber: 6, name: 'นางสาวกาญจนา' }
    // เพิ่มข้อมูลบ้านได้ตามต้องการ
  ];

  // ฟังก์ชันที่ใช้ในการแสดงข้อมูลผู้อยู่อาศัย
  getResidentInfo(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    return resident ? `บ้านเลขที่ ${houseNumber}, ผู้อยู่อาศัย: ${resident.name}` : `บ้านเลขที่ ${houseNumber}, ไม่มีข้อมูลผู้อยู่อาศัย`;
  }
}
