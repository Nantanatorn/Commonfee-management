import { style } from '@angular/animations';
import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';
import { Observable } from 'rxjs';
import { PendingPayment, PeymentForAdmin } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';
import Swal from 'sweetalert2';




@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {

  Unpaid : Observable<PeymentForAdmin[]> | undefined;  
  paidList: PeymentForAdmin[] = [];
  lineCharts: Chart | undefined;
  selectedMonth = new Date().getMonth() + 1; // 0 = ทุกเดือน
  pending : Observable<PendingPayment[]> | undefined;

  constructor(private bandeeservice : BanDeeService,){}

  ngOnInit(): void {
    this.reloadLists();
  }

  private reloadLists(): void {
    this.Unpaid = this.bandeeservice.getUnpaid();
    this.bandeeservice.getPaid().subscribe({
      next: (list) => (this.paidList = list),
      error: (err) => console.error('Error loading paid list:', err),
    });
    this.loadIncomeChart();
    this.pending = this.bandeeservice.getPending();
  }

  // ประวัติการชำระ (รายการที่ชำระแล้ว) กรองตามเดือนของวันที่ชำระ
  get historyRows(): PeymentForAdmin[] {
    if (!this.selectedMonth) return this.paidList;
    return this.paidList.filter(p => p.Pay_Date && new Date(p.Pay_Date).getMonth() + 1 === this.selectedMonth);
  }

  // ดูสลิปที่ลูกบ้านแนบ (โหลดผ่าน API ที่ต้อง login แล้วแสดงเป็นรูป)
  viewSlip(p: PendingPayment): void {
    this.bandeeservice.getSlip(p.Pay_ID).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        Swal.fire({
          title: `สลิป: ${p.R_Firstname} ${p.R_Lastname} (บ้าน ${p.House_number})`,
          text: `ยอดที่ต้องได้รับ ${p.Pay_Amount + (p.Pay_Fine || 0)} บาท`,
          imageUrl: url,
          imageAlt: 'สลิปการโอนเงิน',
          imageWidth: 360,
          didClose: () => URL.revokeObjectURL(url),
        });
      },
      error: () => Swal.fire({ title: 'ไม่พบสลิป', text: 'รายการนี้ไม่มีสลิปแนบ', icon: 'info' }),
    });
  }

  // admin ยืนยันว่าได้รับเงินแล้ว -> ออกใบเสร็จ
  confirmPayment(p: PendingPayment): void {
    Swal.fire({
      title: 'ยืนยันการรับเงิน?',
      text: `${p.R_Firstname} ${p.R_Lastname} บ้านเลขที่ ${p.House_number} จำนวน ${p.Pay_Amount + (p.Pay_Fine || 0)} บาท`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.bandeeservice.confirmPayment(p.Pay_ID).subscribe({
        next: () => {
          Swal.fire({ title: 'สำเร็จ!', text: 'ยืนยันการชำระเงินและออกใบเสร็จแล้ว', icon: 'success' });
          this.reloadLists();
        },
        error: (err) => {
          Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: err?.error?.message || 'ไม่สามารถยืนยันได้', icon: 'error' });
          this.reloadLists();
        },
      });
    });
  }

  // admin ไม่พบยอดเงิน -> ตีกลับเป็นค้างชำระ
  rejectPayment(p: PendingPayment): void {
    Swal.fire({
      title: 'ปฏิเสธการแจ้งชำระ?',
      text: 'บิลนี้จะกลับไปเป็นสถานะค้างชำระ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.bandeeservice.rejectPayment(p.Pay_ID).subscribe({
        next: () => this.reloadLists(),
        error: (err) => {
          Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: err?.error?.message || 'ไม่สามารถปฏิเสธได้', icon: 'error' });
          this.reloadLists();
        },
      });
    });
  }

  SendBill(){
    this.bandeeservice.sendBill().subscribe({
      next: (response) => {
        console.log('Bill created successfully:', response);
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'คุณได้ทำการสร้างบิลใหม่แล้ว',
          icon: 'success',
        });
        this.reloadLists();
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

  // แก้อัตราค่าส่วนกลาง/ค่าปรับ ตามขนาดบ้าน
  changeFee(): void {
    this.bandeeservice.getAllFee().subscribe({
      next: (rates) => {
        if (!rates.length) {
          Swal.fire({ title: 'ไม่พบอัตราค่าส่วนกลาง', icon: 'info' });
          return;
        }
        const options = rates.map(r => `<option value="${r.House_Size}">${r.House_Size}</option>`).join('');
        Swal.fire({
          title: 'แก้ไขอัตราชำระ',
          html: `
            <div style="text-align:left;display:grid;gap:8px">
              <label>ขนาดบ้าน <select id="fee-size" class="swal2-select" style="margin:4px 0 0;width:100%">${options}</select></label>
              <label>ขนาดที่ดิน (ตร.ว.) <input id="fee-land" type="number" min="1" class="swal2-input" style="margin:4px 0 0;width:100%"></label>
              <label>อัตราต่อหน่วย (บาท) <input id="fee-rate" type="number" min="0.01" step="0.01" class="swal2-input" style="margin:4px 0 0;width:100%"></label>
              <label>ค่าปรับ (บาท) <input id="fee-fine" type="number" min="0" step="0.01" class="swal2-input" style="margin:4px 0 0;width:100%"></label>
            </div>`,
          showCancelButton: true,
          confirmButtonText: 'บันทึก',
          cancelButtonText: 'ยกเลิก',
          didOpen: () => {
            const el = (id: string) => document.getElementById(id) as HTMLInputElement;
            const fill = () => {
              const r = rates.find(x => x.House_Size === el('fee-size').value);
              if (!r) return;
              el('fee-land').value = String(r.Land_size);
              el('fee-rate').value = String(r.FeeRate);
              el('fee-fine').value = String(r.Fine);
            };
            el('fee-size').addEventListener('change', fill);
            fill();
          },
          preConfirm: () => {
            const el = (id: string) => document.getElementById(id) as HTMLInputElement;
            const body = {
              House_Size: el('fee-size').value,
              Land_size: Number(el('fee-land').value),
              FeeRate: Number(el('fee-rate').value),
              Fine: Number(el('fee-fine').value),
            };
            if (!(body.Land_size > 0) || !(body.FeeRate > 0) || !(body.Fine >= 0) || el('fee-fine').value === '') {
              Swal.showValidationMessage('กรอกขนาดที่ดินและอัตราให้มากกว่า 0 และค่าปรับตั้งแต่ 0 ขึ้นไป');
              return false;
            }
            return body;
          },
        }).then((result) => {
          if (!result.isConfirmed || !result.value) return;
          this.bandeeservice.changeRate(result.value).subscribe({
            next: () => Swal.fire({ title: 'สำเร็จ!', text: 'บันทึกอัตราใหม่แล้ว (มีผลกับบิลที่ออกต่อจากนี้)', icon: 'success' }),
            error: (err) => Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: err?.error?.message || 'ไม่สามารถบันทึกได้', icon: 'error' }),
          });
        });
      },
      error: () => Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: 'โหลดอัตราค่าส่วนกลางไม่สำเร็จ', icon: 'error' }),
    });
  }

  // กราฟรายรับรายเดือนจากใบเสร็จจริง
  private loadIncomeChart(): void {
    this.bandeeservice.getIncome().subscribe({
      next: (data) => {
        this.lineCharts = new Chart({
          chart: { type: 'line', height: 320, backgroundColor: 'transparent', style: { fontFamily: 'IBM Plex Sans Thai, sans-serif' } },
          colors: ['#d9a441'],
          plotOptions: { series: { lineWidth: 3, marker: { radius: 4, symbol: 'circle' } } },
          title: { text: 'เงินเข้าแต่ละเดือน', align: 'left', style: { fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: '17px', fontWeight: '600' } },
          credits: { enabled: false },
          xAxis: {
            categories: data.map(d => d.Month),
            title: { text: 'เดือน', style: { fontFamily: 'IBM Plex Sans Thai, sans-serif' } },
          },
          yAxis: {
            title: { text: 'จำนวนเงิน(บาท)', style: { fontFamily: 'IBM Plex Sans Thai, sans-serif' } },
            min: 0,
          },
          series: [
            { name: 'ลูกบ้าน', data: data.map(d => d.TotalAmount) } as any,
          ],
        });
      },
      error: (err) => console.error('Error loading income:', err),
    });
  }
}
