import { BanDeeService } from './../../service/ban-dee.service';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Chart } from 'angular-highcharts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MonthlyPaymentData, PeymentForAdmin } from '../../model/model';
import { Observable } from 'rxjs/internal/Observable';

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
  Unpaid : Observable<PeymentForAdmin[]> | undefined;  
  paid : Observable<PeymentForAdmin[]> | undefined;
  lineCharts: Chart | undefined;


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
    this.fetchMonthlyPaymentData();
    
  }

  // ดึงข้อมูลลูกบ้านจาก API
  loadResidentsData(): void {
    this.BanService.getResidentStatus().subscribe((data) => {
      // สร้าง object เพื่อเก็บจำนวนยอดค้างชำระสำหรับแต่ละ resident โดยใช้ R_ID เป็น key
      const overdueCounts: { [key: number]: number } = {};
  
      data.forEach((resident: any) => {
        if (resident.Pay_Status && resident.Pay_Status.trim() === 'Overdue') {
          overdueCounts[resident.R_ID] = (overdueCounts[resident.R_ID] || 0) + 1;
        }
      });
  
      // map ข้อมูลจาก data เพื่อสร้าง resident แต่ละตัวที่มีข้อมูลครบถ้วน
      this.residents = data.map(resident => ({
        houseNo: resident.House_No,  // ใช้ House_No แทน House_number
        name: `${resident.R_Firstname} ${resident.R_Lastname}`,  // ชื่อผู้อยู่อาศัย
        hasResident: resident.status.trim() === 'Living',
        hasPaid: resident.Pay_Status === null || resident.Pay_Status.trim() === 'Paid', // ตรวจสอบ Pay_Status ว่าเป็น null หรือ 'Paid'
        isOverdue: resident.Pay_Status && resident.Pay_Status.trim() === 'Overdue', // ตรวจสอบว่าค้างชำระหรือไม่
        House_number: resident.House_number,
        phone: resident.phone,
        status: resident.Pay_Status,
        overdueCount: overdueCounts[resident.R_ID] || 0 // เพิ่มจำนวนยอดค้างชำระให้กับแต่ละ resident
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
    } else if (this.residents.some(r => r.houseNo === houseNo && r.isOverdue)) {
      return '#ff0000'; // สีแดงหากมีบ้านที่ยังมียอดค้างชำระ
    } else {
      return '#40ff00'; // สีเขียวสำหรับบ้านที่ชำระเงินครบแล้วหรือไม่มีข้อมูลการชำระ (NULL)
    }
  }
  
  // ฟังก์ชันแสดงข้อมูลผู้อยู่อาศัย
  getResidentInfo(houseNo: number): string {
    const resident = this.residents.find(r => r.houseNo === houseNo);
  
    if (resident) {
      if (resident.hasResident) {
        return ` บ้านเลขที่: ${resident.House_number}, ผู้อยู่อาศัย: ${resident.name}, เบอร์ติดต่อ: ${resident.phone}, สถานะ: ${resident.status}, ยอดค้างชำระ: ${resident.overdueCount}`;
      } else {
        return `บ้านเลขที่: ${resident.House_number}, ไม่มีผู้อยู่อาศัย`;  // แสดงข้อมูลบ้านเลขที่ถึงแม้ไม่มีผู้อยู่อาศัย
      }
    } else {
      return `บ้านเลขที่ ${houseNo}, ไม่มีข้อมูลผู้อยู่อาศัย`;
    }
  }

SendBill(){
  this.BanService.sendBill().subscribe({
    next: (response) => {
      console.log('Bill created successfully:', response);
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'คุณได้ทำการสร้างบิลใหม่แล้ว',
        icon: 'success',
      });
      this.loadResidentsData();
      this.Unpaid = this.BanService.getUnpaid();
      this.paid = this.BanService.getPaid();
    },  error: (err) => {
      console.error('Error creating bill:', err);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถสร้างบิลได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
      });
    }
  });
}

  openModal() {
    this.isModalOpen = true;
  }

  
  closeModal() {
    this.isModalOpen = false;
    this.clearNewsFields(); 
  }

  changeFee(){

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
 
  
  fetchMonthlyPaymentData(): void {
    this.BanService.getMonthlyPaymentData().subscribe(
      (data: MonthlyPaymentData[]) => {
        this.MonthlyPaidCheck(data);
      },
      (error) => {
        console.error('Error fetching monthly payment data:', error);
      }
    );
  }

  MonthlyPaidCheck(data: MonthlyPaymentData[]): void {
    const categories = data.map((item) => item.Pay_Month);
    const paidData = data.map((item) => item.Paid_Count);
    const overdueData = data.map((item) => item.Overdue_Count);

    this.lineCharts = new Chart({
      chart: {
        type: 'line',
        style: {
          fontFamily: 'Noto Sans Thai, sans-serif',
        },
      },
      title: {
        text: 'แสดงผู้จ่ายและไม่จ่ายในแต่ละเดือน',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: categories,
        title: {
          text: 'เดือน',
        },
      },
      yAxis: {
        title: {
          text: 'จำนวนลูกบ้าน',
        },
      },
      series: [
        {
          name: 'คนจ่าย',
          data: paidData,
        } as any,
        {
          name: 'คนไม่จ่าย',
          data: overdueData,
        } as any,
      ],
    });
  }

  lineCharts1 = new Chart({
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
