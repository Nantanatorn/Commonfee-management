import { Component } from '@angular/core';

interface House {
  houseNumber: string;
  ownerName: string;
  isPaid: boolean;
}

@Component({
  selector: 'app-status',
  templateUrl: './admin-status.component.html',
  styleUrls: ['./admin-status.component.css']
})
export class statusAdminComponent {
  houses: House[] = [
    { houseNumber: 'A1', ownerName: 'นายสมชาย', isPaid: true },
    { houseNumber: 'A2', ownerName: 'นางสมศรี', isPaid: false },
    { houseNumber: 'A3', ownerName: 'นายสมบัติ', isPaid: true },
    { houseNumber: 'B1', ownerName: 'นางสมฤดี', isPaid: false },
    { houseNumber: 'B2', ownerName: 'นายสมหมาย', isPaid: true },
  ];

  togglePaymentStatus(house: House) {
    house.isPaid = !house.isPaid;
  }
}
