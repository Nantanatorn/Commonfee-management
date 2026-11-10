import { BanDeeService } from './../../service/ban-dee.service';
import { Component, OnInit } from '@angular/core';
import { buildVillage } from './village-layout';
import Swal from 'sweetalert2';
import { Chart } from 'angular-highcharts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Announcement, FeeRate, Income, Lastpaid, MonthlyPaymentData, MonthlyPetitionData, PeymentForAdmin } from '../../model/model';
import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  residents: any[] = [];
  isModalOpen: boolean = false;
  isModalOpen1: boolean = false;
  isModalOpen2: boolean = false;
  newsTitle: string = '';
  newsContent: string = '';
  AddNewsform: FormGroup; 
  ChangeFee : FormGroup;
  EditNewsform : FormGroup;
  selectedFile: File | null = null;
  Unpaid : Observable<PeymentForAdmin[]> | undefined;  
  paid : Observable<PeymentForAdmin[]> | undefined;
  lineCharts: Chart | undefined;
  lineCharts1 : Chart | undefined
  houseSizes: FeeRate[] = [];
  isLoading: boolean = false;
  pieChart : Chart;
  private LastpaidS = new BehaviorSubject<Lastpaid[]>([]);
  LastpaidS$: Observable<Lastpaid[]> = this.LastpaidS.asObservable();
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 5;
  Announcement = new BehaviorSubject<Announcement[]>([]);
  selectedAnnouncementID: number | null = null;

  // ===== ข้อมูลสำหรับการ์ดบน dashboard =====
  unpaidList: PeymentForAdmin[] = [];

  // กราฟแท่งคู่: ผู้จ่าย / ไม่จ่าย รายเดือน
  payBars: { label: string; paid: number; overdue: number; paidPct: number; overduePct: number }[] = [];
  payTicks: number[] = [];

  // กราฟเส้น: รายได้รายเดือน (วาดด้วย SVG)
  readonly lineBox = { w: 560, h: 250, l: 46, r: 18, t: 18, b: 30 };
  incomePts: { x: number; y: number; label: string; value: number }[] = [];
  incomeTicks: { y: number; label: string }[] = [];
  incomeLine = '';
  incomeArea = '';
  hoverIdx = -1;

  // สัดส่วนคำร้อง (วงแหวน)
  readonly donutC = 2 * Math.PI * 52;
  donut: { total: number; segs: { label: string; value: number; pct: number; color: string; dash: string; offset: number }[] } = { total: 0, segs: [] };

  currentPage1: number = 1;
  totalPages1: number = 1;
  pageSize1: number = 3;


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
      Land_size: ['', [Validators.required, Validators.min(1)]], 
      FeeRate: ['', [Validators.required, Validators.min(0.01)]],
      Fine: ['', [Validators.required, Validators.min(0)]],
    });
    this.EditNewsform = this.fb.group({
      Announce_Title: ['', Validators.required],
      Announce_Detail: ['', Validators.required],
      Announce_Status : ['']
    });
  }

  ngOnInit(): void {
    this.loadUnpaid();
    this.loadResidentsData();
    this.fetchMonthlyPaymentData();
    this.loadHouseSizes(); 
    this.getMonthlyIncome();
    this.loadPieChartData();
    this.loadLastpaidData(this.currentPage, this.pageSize);
    this.reloadNews(this.currentPage1, this.pageSize1);
  }

  reloadNews(page: number, limit: number) {
    this.BanService.getNewsPage(page, limit).subscribe({
      next: (response) => {
        this.Announcement.next(response.data); 
        this.currentPage1 = response.currentPage; 
        this.totalPages1 = response.totalPages;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
      },
    });
  }
  goToNextPage1(): void {
    if (this.currentPage1 < this.totalPages1) {
      this.currentPage1++;
      this.reloadNews(this.currentPage1, this.pageSize1);
    }
  }

  goToPreviousPage1(): void {
    if (this.currentPage1 > 1) {
      this.currentPage1--;
      this.reloadNews(this.currentPage1, this.pageSize1);
    }
  }

  goToPage1(page: number): void {
    if (page >= 1 && page <= this.totalPages1) {
      this.currentPage1 = page;
      this.reloadNews(this.currentPage1, this.pageSize1);
    }
  }

  editAnnouncement( news : Announcement ){
    this.isModalOpen2 = true; 
    this.selectedAnnouncementID = news.Announce_ID; 

    this.EditNewsform.patchValue({
      Announce_Title :  news.Announce_Title,
      Announce_Detail : news.Announce_Detail,
      Announce_Status : news.Announce_Status
    });
  }

   
  onEdit(){
    if (this.EditNewsform.invalid) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน!',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนทำการบันทึก',
        icon: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('Announce_Title', this.EditNewsform.get('Announce_Title')?.value);
    formData.append('Announce_Detail', this.EditNewsform.get('Announce_Detail')?.value);
    formData.append('Announce_Status', this.EditNewsform.get('Announce_Status')?.value);

    if (this.selectedFile) {
      formData.append('Announce_image', this.selectedFile);
    }

    this.http.put(`http://localhost:3500/editanoucement/${this.selectedAnnouncementID}`, formData).subscribe({
      next: (response) => {
        Swal.fire({
          title: "สำเร็จ!",
          text: "ข่าวสารได้ถูกประกาศออกไปแล้ว!",
          icon: "success"
        });
        this.reloadNews(this.currentPage, this.pageSize);
        this.closeModal2();
      },
      error: (error) => {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถแก้ไขข่าวสารได้ กรุณาลองใหม่อีกครั้ง',
          icon: 'error'
        });
        console.error('Error ', error);
      }
    });
  }


  loadLastpaidData(page: number, limit: number): void {
    this.BanService.getLast(page, limit).subscribe({
      next: (response) => {
        this.LastpaidS.next(response.data);
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
      },
      error: (error) => {
        console.error('Error loading residents:', error);
      },
    });
  }  
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLastpaidData(this.currentPage, this.pageSize);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLastpaidData(this.currentPage, this.pageSize);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLastpaidData(this.currentPage, this.pageSize);
    }
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
  // ===== ผังหมู่บ้าน =====
  readonly village = buildVillage();
  tip = { show: false, flip: false, x: 0, y: 0, text: '' };

  showTip(ev: MouseEvent, houseNo: number): void {
    const host = (ev.currentTarget as Element).closest('.village-layout') as HTMLElement | null;
    const r = host ? host.getBoundingClientRect() : { left: 0, top: 0, width: 0 };
    const x = ev.clientX - r.left;
    this.tip = {
      show: true,
      flip: r.width > 0 && x > r.width * 0.6,
      x: x + (x > r.width * 0.6 ? -14 : 14),
      y: ev.clientY - r.top + 16,
      text: this.getResidentInfo(houseNo)
    };
  }

  hideTip(): void {
    this.tip = { ...this.tip, show: false };
  }

  // ===== ตัวเลขสรุป (นับเป็นจำนวนหลัง) =====
  get totalHouses(): number {
    return this.village.lots.length;
  }

  get livingCount(): number {
    return new Set(this.residents.filter(r => r.hasResident).map(r => r.houseNo)).size;
  }

  get overdueHouseCount(): number {
    return new Set(this.residents.filter(r => r.hasResident && r.isOverdue).map(r => r.houseNo)).size;
  }

  get paidHouseCount(): number {
    return this.livingCount - this.overdueHouseCount;
  }

  private pct(part: number, whole: number): number {
    return whole ? Math.round((part / whole) * 100) : 0;
  }
  get occupancyPct(): number { return this.pct(this.livingCount, this.totalHouses); }
  get paidPct(): number { return this.pct(this.paidHouseCount, this.livingCount); }
  get overduePct(): number { return this.pct(this.overdueHouseCount, this.livingCount); }

  // ===== รายการค้างชำระ (การ์ดด้านข้าง) =====
  loadUnpaid(): void {
    this.BanService.getUnpaid().subscribe({
      next: (list) => { this.unpaidList = list; },
      error: (error) => console.error('Error loading unpaid list:', error),
    });
  }

  get unpaidTop(): PeymentForAdmin[] {
    return this.unpaidList.slice(0, 8);
  }

  get overdueTotal(): number {
    return this.unpaidList.reduce((sum, u) => sum + (Number(u.Pay_Amount) || 0), 0);
  }

  // ===== ช่วยคำนวณแกนกราฟ =====
  private niceStep(raw: number): number {
    if (!(raw > 0)) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / pow;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return m * pow;
  }

  private fmtK(v: number): string {
    return v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v);
  }

  // ===== กราฟแท่งคู่: ผู้จ่าย / ไม่จ่าย =====
  private buildPayBars(data: MonthlyPaymentData[]): void {
    const max = Math.max(0, ...data.map(d => Math.max(d.Paid_Count, d.Overdue_Count)));
    const step = this.niceStep(max / 4);
    const top = step * 4;
    this.payTicks = [4, 3, 2, 1, 0].map(i => i * step);
    this.payBars = data.map(d => ({
      label: d.Pay_Month,
      paid: d.Paid_Count,
      overdue: d.Overdue_Count,
      paidPct: (d.Paid_Count / top) * 100,
      overduePct: (d.Overdue_Count / top) * 100,
    }));
  }

  // ===== กราฟเส้น: รายได้ =====
  private buildIncomeLine(data: Income[]): void {
    const { w, h, l, r, t, b } = this.lineBox;
    const innerW = w - l - r;
    const innerH = h - t - b;
    const vals = data.map(d => Number(d.TotalAmount) || 0);
    const step = this.niceStep(Math.max(0, ...vals) / 4);
    const top = step * 4;
    const n = data.length;

    this.incomePts = data.map((d, i) => ({
      x: l + (n > 1 ? (innerW * i) / (n - 1) : innerW / 2),
      y: t + innerH * (1 - vals[i] / top),
      label: d.Month,
      value: vals[i],
    }));
    this.incomeTicks = [4, 3, 2, 1, 0].map(i => ({ y: t + innerH * (1 - i / 4), label: this.fmtK(i * step) }));
    this.incomeLine = this.incomePts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    this.incomeArea = n
      ? `${this.incomeLine} L${this.incomePts[n - 1].x.toFixed(1)} ${t + innerH} L${this.incomePts[0].x.toFixed(1)} ${t + innerH} Z`
      : '';
    this.hoverIdx = n - 1;
  }

  get hoverPt() {
    return this.incomePts[this.hoverIdx];
  }

  get sumIncome(): number {
    return this.incomePts.reduce((sum, p) => sum + p.value, 0);
  }

  // แท่งกราฟเส้นที่ใกล้เมาส์ที่สุด (แปลงพิกัดเมาส์เป็นพิกัด viewBox)
  onLineMove(ev: MouseEvent): void {
    if (!this.incomePts.length) return;
    const rect = (ev.currentTarget as SVGElement).getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * this.lineBox.w;
    let best = 0;
    this.incomePts.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs(this.incomePts[best].x - x)) best = i;
    });
    this.hoverIdx = best;
  }

  // ===== สัดส่วนคำร้อง (วงแหวน) =====
  buildDonut(repair: number, normal: number): void {
    const total = repair + normal;
    const parts = [
      { label: 'แจ้งซ่อม', value: repair, color: '#c9993f' },
      { label: 'ทั่วไป', value: normal, color: '#6f86d6' },
    ];
    let acc = 0;
    const segs = parts.map(p => {
      const frac = total ? p.value / total : 0;
      const len = this.donutC * frac;
      const seg = { label: p.label, value: p.value, pct: Math.round(frac * 100), color: p.color,
        dash: `${Math.max(len - 6, 0)} ${this.donutC}`, offset: -acc };
      acc += len;
      return seg;
    });
    this.donut = { total, segs };
  }

  getHouseColor(houseNo: number): string {
    const resident = this.residents.find(r => r.houseNo === houseNo);
  
    if (!resident || !resident.hasResident) {
      return '#ffffff'; // สีขาวสำหรับบ้านที่ไม่มีคนอยู่
    } else if (this.residents.some(r => r.houseNo === houseNo && r.isOverdue)) {
      return '#ee6055'; // สีแดงหากมีบ้านที่ยังมียอดค้างชำระ
    } else {
      return '#4cc38a'; // สีเขียวสำหรับบ้านที่ชำระเงินครบแล้วหรือไม่มีข้อมูลการชำระ (NULL)
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
  closeModal2() {
    this.isModalOpen2 = false;
    this.clearNewsFields(); 
  }

 

  clearNewsFields() {
    this.newsTitle = '';
    this.newsContent = '';
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png' , 'image/webp'];
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
        this.reloadNews(this.currentPage1, this.pageSize1);
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
    this.buildIncomeLine(data);
    const Income = data.map((item) => item.TotalAmount);
    const Month = data.map((item) => item.Month);
  
    this.lineCharts1 = new Chart({
      chart: {
        type: 'line',
        style: {
          fontFamily: 'IBM Plex Sans Thai, sans-serif',
        }
      },
      title: {
        text: 'รายได้จากการค่าส่วนกลาง',
        style: {
          fontFamily: 'IBM Plex Sans Thai, sans-serif',
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
            fontFamily: 'IBM Plex Sans Thai, sans-serif',
          }
        },
        min: 0
      },
      yAxis: {
        title: {
          text: 'จำนวนเงิน(บาท)',
          style: {
            fontFamily: 'IBM Plex Sans Thai, sans-serif',
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
    this.buildPayBars(data);

    this.lineCharts = new Chart({
      chart: {
        type: 'line',
        style: {
          fontFamily: 'IBM Plex Sans Thai, sans-serif',
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
          color: '#22c55e',
        } as any,
        {
          name: 'คนไม่จ่าย',
          data: overdueData,
          color: '#ef4444',
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

            this.buildDonut(totalRepair, totalNormal);
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
          fontFamily: 'IBM Plex Sans Thai, sans-serif',
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
