import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import {Chart} from 'angular-highcharts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // ใช้ styleUrls แทน styleUrl
})
export class DashboardComponent {
  isModalOpen: boolean = false;
  newsTitle: string = '';
  newsContent: string = '';

  residents = [
    { houseNumber: 1, name: 'นายสมชาย' },
    { houseNumber: 2, name: 'นางสมศรี' },
    { houseNumber: 3, name: 'นายจิตร' },
    { houseNumber: 4, name: 'นางสมฤดี' },
    { houseNumber: 5, name: 'นายกำธร' },
    { houseNumber: 6, name: 'นางสาวกาญจนา' }
    // เพิ่มข้อมูลบ้านได้ตามต้องการ
  ];

  getResidentInfo(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    return resident ? `บ้านเลขที่ ${houseNumber}, ผู้อยู่อาศัย: ${resident.name}` : `บ้านเลขที่ ${houseNumber}, ไม่มีข้อมูลผู้อยู่อาศัย`;
  }

   // เปิด modal
   openModal() {
    this.isModalOpen = true;
  }

  // ปิด modal
  closeModal() {
    this.isModalOpen = false;
    this.clearNewsFields(); // ล้างข้อมูลเมื่อปิด modal
  }

  // บันทึกข้อมูลข่าวสาร
  saveNews() {
    if (this.newsTitle.trim() && this.newsContent.trim()) {
      console.log('หัวข้อข่าวสาร:', this.newsTitle);
      console.log('รายละเอียดข่าวสาร:', this.newsContent);
      // คุณสามารถทำการบันทึกข้อมูลหรือส่งข้อมูลไปยัง backend ได้ที่นี่
      this.closeModal();
    } else {
      Swal.fire({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",       
        icon: "info"
       
      });
    }
  }

  // ล้างข้อมูลในฟิลด์
  clearNewsFields() {
    this.newsTitle = '';
    this.newsContent = '';
  }

  lineCharts = new Chart({
    chart :{
      type:'line'
    },
    title:{
      text:'ยอดการจ่ายแต่ละหลัง'
    },
    credits:{
      enabled: false
    },
    xAxis: {
      categories: ['มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย','ต.ค','พ.ย'], // ชื่อสำหรับแกน X
      title: {
        text: 'เดือน'
      }
    },
    yAxis: {
      title: {
        text: 'จำนวนลูกบ้าน'
      },
      min: 0, // ค่าต่ำสุดของแกน Y
      max: 42 // ค่าสูงสุดของแกน Y (ถ้าต้องการ)
    },
    series:[
      {
      name:'คนจ่าย',
      data:[10,12,18,20,11,14]
    }as any,
    {
      name:'คนไม่จ่าย',
      data:[12,15,7]
    }as any
  ]
  })
  pieChart = new Chart({
    chart: {
      type: 'pie',
      plotShadow: false,
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        innerSize: '70%',
        borderWidth: 10,
        borderColor: '',
        slicedOffset: 10,
        dataLabels: {
          enabled: true, // เปิดการแสดงป้ายชื่อ
          format: '{point.name}: {point.percentage:.1f} %', // แสดงชื่อและเปอร์เซ็นต์ของแต่ละส่วน
          connectorWidth: 0,
        },
      },
    },
    title: {
      verticalAlign: 'middle',
      floating: true,
      text: 'ประเภทบ้าน',
    },
    legend: {
      enabled: true, // เปิดการแสดง legend
      align: 'right', // จัดตำแหน่งของ legend
      verticalAlign: 'middle', // จัดให้อยู่ตรงกลางแนวตั้ง
      layout: 'vertical', // แสดง legend ในแนวตั้ง
    },
    series: [
      {
        type: 'pie',
        name: 'บ้านแต่ละประเภท',
        data: [
          { name: 'small', y: 1, color: '#65e1f7' },
          { name: 'medium', y: 2, color: '#da75ee' },
          { name: 'large', y: 3, color: '#fda95b' },
        ],
      },
    ],
  });
  
}
