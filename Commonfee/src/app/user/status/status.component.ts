import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {
  // (สมมติว่าข้อมูลของผู้ใช้ถูกดึงมาจากเซิร์ฟเวอร์)
  @Input() house = {
    date : '10 Oct 2024',
    houseNumber: 'A1',  
    ownerName: 'นายสมชาย',
    title: ' ไฟบริเวณวงเวียนไม่ทำงาน',
    type: ' ซ่อม ',
    isFinish: true
  };
}
