import { Component } from '@angular/core';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.css'
})
export class PurchaseComponent {
  myAngularxQrCode:any;
  constructor(){
    this.myAngularxQrCode = 'จ่ายมา 2500 บาท';
  }
}
