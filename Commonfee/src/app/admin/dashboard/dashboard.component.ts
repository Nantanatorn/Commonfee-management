import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import {Chart} from 'angular-highcharts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // ใช้ styleUrls แทน styleUrl
})
export class DashboardComponent {

  isModalOpen: boolean = false;
  newsTitle: string = '';
  newsContent: string = '';
  AddNewsform : FormGroup; 
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router, ){

    this.AddNewsform = this.fb.group({
      Announce_Title: ['', Validators.required],
      Announce_Detail: ['', Validators.required]
       });
    }

  residents = [
    { houseNumber: 1, name: 'นายสมชาย' , hasResident: true,hasPaid: true},
    { houseNumber: 2, name: 'นางสมศรี', hasResident: true ,hasPaid: true},
    { houseNumber: 3, name: 'นายจิตร' , hasResident: true,hasPaid: true},
    { houseNumber: 4, name: 'นางสมฤดี' , hasResident: true,hasPaid: true},
    { houseNumber: 5, name: 'นายกำธร' , hasResident: true,hasPaid: true},
    { houseNumber: 6, name: 'นางสาวกาญจนา' , hasResident: true,hasPaid: false}
    // เพิ่มข้อมูลบ้านได้ตามต้องการ
  ];

  getHouseColor(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    if (!resident || !resident.hasResident) {
      return '#ffffff'; // สีขาวสำหรับบ้านที่ไม่มีคนอยู่
    } else if (!resident.hasPaid) {
      return '#ff0000'; // สีแดงสำหรับบ้านที่ยังไม่จ่าย
    } else {
      return '#40ff00'; // สีเขียวที่คนอยู่และจ่ายแล้ว
    }
  }

  getResidentInfo(houseNumber: number): string {
    const resident = this.residents.find(r => r.houseNumber === houseNumber);
    return resident && resident.name
      ? `บ้านเลขที่ ${houseNumber}, ผู้อยู่อาศัย: ${resident.name}`
      : `บ้านเลขที่ ${houseNumber}, ไม่มีข้อมูลผู้อยู่อาศัย`;
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
      categories: ['มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย','ต.ค'], // ชื่อสำหรับแกน X
      title: {
        text: 'เดือน'
      },
      min: 0, 
      max: 4
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
  
  onSubmit(): void {
    if (this.AddNewsform.valid) {
      const formData = new FormData();
      formData.append('Announce_Title', this.AddNewsform.get('Announce_Title')?.value);
      formData.append('Announce_Detail', this.AddNewsform.get('Announce_Detail')?.value);

      if (this.selectedFile) {
        formData.append('Announce_image', this.selectedFile);
      }

      this.http.post('http://localhost:3500/addanoucement', formData).subscribe({
        next: (response) => {
          console.log('Announcement successfully', response);
          this.showPopup();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error ', error);
          console.log(this.AddNewsform.errors);
          console.log(this.AddNewsform.value);
        }
      });
    } else {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  }
  showPopup() {
    Swal.fire({
      title: "สำเร็จ!",
      text: "ข่าวสารได้ถูกประกาศออกไปแล้ว!",
      icon: "success"
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

}
