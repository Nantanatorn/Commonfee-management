import { style } from '@angular/animations';
import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';




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
  getResidentInfo(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    return resident ? `บ้านเลขที่ ${houseNumber}, ผู้อยู่อาศัย: ${resident.name}` : `บ้านเลขที่ ${houseNumber}, ไม่มีข้อมูลผู้อยู่อาศัย`;
  }
  lineCharts = new Chart({
    chart :{
      type:'line',
      style:{
        fontFamily: 'Noto Sans Thai, sans-serif',
      }
    },
    title:{
      text:'เงินเข้าแต่ละเดือน',
      style:{
        fontFamily: 'Noto Sans Thai, sans-serif',
      }
    },
    credits:{
      enabled: false
    },
    xAxis: {
      categories: ['มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย','ต.ค'], // ชื่อสำหรับแกน X
      title: {
        text: 'เดือน',
        style:{
          fontFamily: 'Noto Sans Thai, sans-serif',
        }
      },
      min: 0, // ค่าต่ำสุดของแกน Y
      max: 4 // ค่าสูงสุดของแกน Y (ถ้าต้องการ)
    },
    yAxis: {
      title: {
        text: 'จำนวนเงิน(บาท)',
        style:{
          fontFamily: 'Noto Sans Thai, sans-serif',
        }
      },
      min: 0, // ค่าต่ำสุดของแกน Y
      max: 1000 // ค่าสูงสุดของแกน Y (ถ้าต้องการ)
    },
    series:[
      {
      name:'ลูกบ้าน',
      data:[100,500,200,250,170,600],
      color:'#f887dd'
    }as any
    
  ]
  })
}
