import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent {
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
    chart:{
      type :'pie',
      plotShadow: false,
    },
    credits:{
      enabled:false,
    },
    plotOptions:{
      pie:{
        innerSize:'99%',
        borderWidth:10,
        borderColor:'',
        slicedOffset:10,
        dataLabels:{
          connectorWidth:0,
        },
      },
    },
    title:{
      verticalAlign:'middle',
      floating:true,
      text:'ประเภทบ้าน',
    },
    legend:{
      enabled:false,
    },
    series:[
      {
      type:'pie',
      data: [
        {name:'small',y:1,color:'#65e1f7'},
        {name:'medium',y:2,color:'#da75ee'},
        {name:'large',y:3,color:'#fda95b'},
      
      ],
      },
    ],
  })
}
