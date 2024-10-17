import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';

@Component({
  selector: 'app-complain-repair',
  templateUrl: './complain-repair.component.html',
  styleUrl: './complain-repair.component.css'
})
export class ComplainRepairComponent {
  lineCharts = new Chart({
    chart :{
      type:'line'
    },
    title:{
      text:'แสดงร้องเรียนในแต่ละเดือน'
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
        text: 'จำนวนร้องเรียน'
      },
      min: 0, // ค่าต่ำสุดของแกน Y
      max: 42 // ค่าสูงสุดของแกน Y (ถ้าต้องการ)
    },
    series:[
      {
      name:'ร้องเรียนทั่วไป',
      data:[10,12,18,20,11,14]
    }as any,
    {
      name:'ร้องเรียนซ่อม',
      data:[12,15,7]
    }as any
  ]
  })
}