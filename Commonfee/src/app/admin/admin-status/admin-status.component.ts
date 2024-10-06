import { Component } from '@angular/core';

interface House {
  houseNumber: string;
  ownerName: string;
  isPaid: boolean;
  size : string;
  feetotal: string
}

@Component({
  selector: 'app-status',
  templateUrl: './admin-status.component.html',
  styleUrls: ['./admin-status.component.css']
})
export class statusAdminComponent {
  houses: House[] = [
    { houseNumber: 'A1', ownerName: 'นายสมชาย', size: '500 ตร.ว', feetotal: '10000 บาท', isPaid: true },
    { houseNumber: 'A2', ownerName: 'นางสมศรี',  size: '500 ตร.ว', feetotal: '10000 บาท',isPaid: false },
    { houseNumber: 'A3', ownerName: 'นายสมบัติ',  size: '500 ตร.ว', feetotal: '10000 บาท',isPaid: true },
    { houseNumber: 'B1', ownerName: 'นางสมฤดี',  size: '500 ตร.ว', feetotal: '10000 บาท',isPaid: false },
    { houseNumber: 'B2', ownerName: 'นายสมหมาย',  size: '500 ตร.ว', feetotal: '10000 บาท',isPaid: true },
  ];

  togglePaymentStatus(house: House) {
    house.isPaid = !house.isPaid;
  }
}
