import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent {
  zoom = 12;
  center: google.maps.LatLngLiteral = { lat: 13.736717, lng: 100.523186 }; // ตำแหน่งหมู่บ้าน
  markers = [
    {
      position: { lat: 13.736717, lng: 100.523186 } // ตำแหน่งที่ต้องการมาร์ก
    },
    {
      position: { lat: 13.745834, lng: 100.521527 } // ตำแหน่งอื่น
    }
  ];
}