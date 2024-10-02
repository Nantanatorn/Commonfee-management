import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {
  // (สมมติว่าข้อมูลของผู้ใช้ถูกดึงมาจากเซิร์ฟเวอร์)
  @Input() house = {
    houseNumber: 'A1',  
    ownerName: 'นายสมชาย',
    isPaid: true
  };
}
