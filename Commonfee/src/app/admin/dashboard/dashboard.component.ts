import { BanDeeService } from './../../service/ban-dee.service';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Chart } from 'angular-highcharts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  residents: any[] = [];
  isModalOpen: boolean = false;
  newsTitle: string = '';
  newsContent: string = '';
  AddNewsform: FormGroup; 
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router, 
    private BanService: BanDeeService
  ) {
    this.AddNewsform = this.fb.group({
      Announce_Title: ['', Validators.required],
      Announce_Detail: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadResidentsData();
  }

  // ดึงข้อมูลลูกบ้านจาก API
  loadResidentsData(): void {
    this.BanService.getResidentStatus().subscribe((data) => {
      this.residents = data.map(resident => ({
        houseNo: resident.House_No,  // ใช้ House_No ที่เป็น number แทน House_number ที่เป็น string
        name: `${resident.R_Firstname} ${resident.R_Lastname}`,  // ชื่อผู้อยู่อาศัย
        hasResident: resident.status.trim() === 'Living',  // ตรวจสอบสถานะการอยู่อาศัย
        hasPaid: resident.Pay_Status.trim() === 'Paid', // คุณอาจต้องปรับปรุงส่วนนี้ให้ดึงสถานะการจ่ายจาก API
        phone : resident.phone,
        House_number : resident.House_number
      }));
    }, error => {
      console.error("Error loading residents data: ", error);
    });
  }
  
  // ฟังก์ชันกำหนดสีของบ้าน
  getHouseColor(houseNo: number): string {
    const resident = this.residents.find(r => r.houseNo === houseNo);
    if (!resident || !resident.hasResident) {
      return '#ffffff'; // สีขาวสำหรับบ้านที่ไม่มีคนอยู่
    } else if (!resident.hasPaid) {
      return '#ff0000'; // สีแดงสำหรับบ้านที่ยังไม่จ่าย
    } else {
      return '#40ff00'; // สีเขียวสำหรับบ้านที่จ่ายแล้ว
    }
  }
  
  // ฟังก์ชันแสดงข้อมูลผู้อยู่อาศัย
  getResidentInfo(houseNo: number): string {
  const resident = this.residents.find(r => r.houseNo === houseNo);

  if (resident) {
    if (resident.hasResident) {
      return `บ้านที่ ${houseNo}, บ้านเลขที่: ${resident.House_number}, ผู้อยู่อาศัย: ${resident.name}, เบอร์ติดต่อ: ${resident.phone}`;
    } else {
      return `บ้านเลขที่: ${resident.House_number}, ไม่มีผู้อยู่อาศัย`;  // ยังแสดงบ้านเลขที่แม้ไม่มีคนอาศัย
    }
  } else {
    return `บ้านเลขที่ ${houseNo}, ไม่มีข้อมูลผู้อยู่อาศัย`;
  }
}

  
  openModal() {
    this.isModalOpen = true;
  }

  
  closeModal() {
    this.isModalOpen = false;
    this.clearNewsFields(); 
  }

 
  clearNewsFields() {
    this.newsTitle = '';
    this.newsContent = '';
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาอัปโหลดไฟล์ที่เป็น .jpeg หรือ .png เท่านั้น');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // จำกัดขนาดไฟล์ไม่เกิน 5MB
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      this.selectedFile = file;
    }
  }

  // ฟังก์ชันสำหรับการส่งข้อมูลฟอร์ม
  onSubmit(): void {
    if (this.AddNewsform.invalid) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน!',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนทำการบันทึก',
        icon: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('Announce_Title', this.AddNewsform.get('Announce_Title')?.value);
    formData.append('Announce_Detail', this.AddNewsform.get('Announce_Detail')?.value);

    if (this.selectedFile) {
      formData.append('Announce_image', this.selectedFile);
    }

    this.http.post('http://localhost:3500/addanoucement', formData).subscribe({
      next: (response) => {
        Swal.fire({
          title: "สำเร็จ!",
          text: "ข่าวสารได้ถูกประกาศออกไปแล้ว!",
          icon: "success"
        });
        this.closeModal();
      },
      error: (error) => {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถประกาศข่าวสารได้ กรุณาลองใหม่อีกครั้ง',
          icon: 'error'
        });
        console.error('Error ', error);
      }
    });
  }

  // กราฟยอดการจ่าย
  lineCharts = new Chart({
    chart: {
      type: 'line',
      style: {
        fontFamily: 'Noto Sans Thai, sans-serif',
      }
    },
    title: {
      text: 'ยอดการจ่ายแต่ละหลัง'
    },
    credits: {
      enabled: false
    },
    xAxis: {
      categories: ['มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย', 'ต.ค'],
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
      min: 0,
      max: 42
    },
    series: [
      {
        name: 'คนจ่าย',
        data: [10, 12, 18, 20, 11, 14]
      } as any,
      {
        name: 'คนไม่จ่าย',
        data: [12, 15, 7]
      } as any
    ]
  });

  // กราฟประเภทบ้าน
  pieChart = new Chart({
    chart: {
      type: 'pie',
      plotShadow: false,
      style: {
        fontFamily: 'Noto Sans Thai, sans-serif',
      }
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        innerSize: '70%',
        borderWidth: 10,
        slicedOffset: 10,
        dataLabels: {
          enabled: true,
          format: '{point.name}: {point.percentage:.1f} %',
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
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
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
