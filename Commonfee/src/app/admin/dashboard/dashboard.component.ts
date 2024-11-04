import { BanDeeService } from './../../service/ban-dee.service';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Chart } from 'angular-highcharts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FeeRate, Income, MonthlyPaymentData, MonthlyPetitionData, PeymentForAdmin } from '../../model/model';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  residents: any[] = [];
  isModalOpen: boolean = false;
  isModalOpen1: boolean = false;
  newsTitle: string = '';
  newsContent: string = '';
  AddNewsform: FormGroup; 
  ChangeFee : FormGroup;
  selectedFile: File | null = null;
  Unpaid : Observable<PeymentForAdmin[]> | undefined;  
  paid : Observable<PeymentForAdmin[]> | undefined;
  lineCharts: Chart | undefined;
  lineCharts1 : Chart | undefined
  houseSizes: FeeRate[] = [];
  isLoading: boolean = false;
  pieChart : Chart;

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
    this.ChangeFee = this.fb.group({
      House_Size: ['', Validators.required],
      Land_size: ['', [Validators.required, Validators.min(0)]], 
      FeeRate: ['', [Validators.required, Validators.min(0)]],
      Fine: ['', [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadResidentsData();
    this.fetchMonthlyPaymentData();
    this.loadHouseSizes(); 
    this.getMonthlyIncome();
    this.loadPieChartData();
    
    
  }

  loadHouseSizes(): void {
    this.BanService.getAllFee().subscribe({
      next: (sizes: FeeRate[]) => {
        this.houseSizes = sizes;
      },
      error: (error) => {
        console.error('Error fetching house sizes:', error);
      }
    });
  }
  
  onHouseSizeChange(event: any): void {
    const selectedSize = event.target.value;
  
    if (selectedSize) {
      this.BanService.getFeeByHouseSize(selectedSize).subscribe({
        next: (feeRates: FeeRate[]) => {
          if (feeRates.length > 0) {
            const feeRate = feeRates[0];
            // แสดงค่าที่ได้รับจาก API
            console.log('Fee Rate Data:', feeRate);
            this.ChangeFee.patchValue({
              Land_size: feeRate.Land_size,
              FeeRate: feeRate.FeeRate,
              Fine: feeRate.Fine,
            });
          }
        },
        error: (error) => {
          console.error('Error fetching fee rate:', error);
        }
      });
    }
  }

  changeFee(): void {
    if (this.ChangeFee.valid) {
      // สร้าง object formData เพื่อส่งข้อมูลไป backend
      const formData = {
        House_Size: this.ChangeFee.value.House_Size,
        Land_size: this.ChangeFee.value.Land_size,
        FeeRate: this.ChangeFee.value.FeeRate,
        Fine : this.ChangeFee.value.Fine
      };
      console.log('Form Data:', formData);
  
      // ใช้ HTTP PUT เพื่อส่งข้อมูลไปที่ backend API
      this.http.put('http://localhost:3500/changerate', formData).subscribe({
        next: (response) => {
          Swal.fire({
            title: "สำเร็จ!",
            text: 'Update Success!',
            icon: "success"
          });
          this.closeModal1(); // ปิด Modal หลังจากการอัปเดตสำเร็จ
        },
        error: (error) => {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: 'กรุณาลองใหม่อีกครั้ง',
            icon: 'error'
          });
          console.error('Error ', error);
        }
      });
    }
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
  Swal.fire({
    title: 'กรุณารอสักครู่...',
    html: 'กำลังเรียกเก็บเงิน...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading(); // แสดง loading spinner
    },
  });
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
  openModal1() {
    this.isModalOpen1 = true;
  }

  
  closeModal() {
    this.isModalOpen = false;
    this.clearNewsFields(); 
  }
  closeModal1() {
    this.isModalOpen1 = false;
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

  sendWarning() {
    // แสดง SweetAlert spinner ขณะที่รอการทำงานเสร็จสิ้น
    Swal.fire({
      title: 'กรุณารอสักครู่...',
      html: 'กำลังส่งการแจ้งเตือน...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(); // แสดง loading spinner
      },
    });
  
    this.BanService.sendUnpaidNotification().subscribe({
      next: (response) => {
        Swal.fire({
          title: 'สำเร็จ!',
          text: response.message,
          icon: 'success',
        });
      },
      error: (error) => {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'การส่งอีเมลล้มเหลว กรุณาลองใหม่อีกครั้ง',
          icon: 'error',
        });
        console.error('Error while sending notification:', error);
      },
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

  getMonthlyIncome(): void {
    this.BanService.getIncome().subscribe(
      (data: Income[]) => {
        // Call getIncome method with the retrieved data
        this.getIncome(data);
      }, 
      (error) => {
        console.error('Error fetching monthly payment data:', error);
      }
    );
  }
  
  getIncome(data: Income[]): void {
    const Income = data.map((item) => item.TotalAmount);
    const Month = data.map((item) => item.Month);
  
    this.lineCharts1 = new Chart({
      chart: {
        type: 'line',
        style: {
          fontFamily: 'Noto Sans Thai, sans-serif',
        }
      },
      title: {
        text: 'รายได้จากการค่าส่วนกลาง',
        style: {
          fontFamily: 'Noto Sans Thai, sans-serif',
        }
      },
      credits: {
        enabled: false
      },
      xAxis: {
        categories: Month, // Update with dynamic month data
        title: {
          text: 'เดือน',
          style: {
            fontFamily: 'Noto Sans Thai, sans-serif',
          }
        },
        min: 0
      },
      yAxis: {
        title: {
          text: 'จำนวนเงิน(บาท)',
          style: {
            fontFamily: 'Noto Sans Thai, sans-serif',
          }
        },
        min: 0,
      },
      series: [
        {
          name: 'รายได้',
          data: Income, // Update with dynamic income data
          color: '#f887dd'
        } as any
      ]
    });
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

  loadPieChartData(): void {
    this.BanService.getAllPetitionCount().subscribe(
        (data: MonthlyPetitionData[]) => {
            const totalRepair = data.reduce((sum, item) => sum + item.Repair_Count, 0);
            const totalNormal = data.reduce((sum, item) => sum + item.Normal_Count, 0);

            // แปลงข้อมูลให้เป็นรูปแบบที่ Pie Chart ต้องการ
            const pieChartData = [
                { name: 'ซ่อม', y: totalRepair, color: '#da75ee' },
                { name: 'ทั่วไป', y: totalNormal, color: '#65e1f7' },
            ];

            this.updatePieChart(pieChartData);
        },
        (error) => {
            console.error('Error fetching complaint data:', error);
        }
    );
}
  
  updatePieChart(data: { name: string; y: number; color: string }[]): void {
    this.pieChart = new Chart({
      chart: {
        type: 'pie',
        plotShadow: false,
        style: {
          fontFamily: 'Noto Sans Thai, sans-serif',
        },
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
        text: 'คำร้องเรียน',
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
          name: 'ประเภทคำร้องเรียน',
          data: data, // ใช้ข้อมูลที่แปลงแล้ว
        },
      ],
    });
  }
  
  
  }
