import { style } from '@angular/animations';
import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';
import { Observable } from 'rxjs';
import { PeymentForAdmin } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';
import Swal from 'sweetalert2';




@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {

  Unpaid : Observable<PeymentForAdmin[]> | undefined;  
  paid : Observable<PeymentForAdmin[]> | undefined;

  constructor(private bandeeservice : BanDeeService,){}

  ngOnInit(): void {
    this.Unpaid = this.bandeeservice.getUnpaid();
    this.paid = this.bandeeservice.getPaid();
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
        this.Unpaid = this.bandeeservice.getUnpaid();
        this.paid = this.bandeeservice.getPaid();
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

  changeFee(){
    
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
