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
      text:'จำนวนลูกบ้านที่อาศัย'
    },
    credits:{
      enabled: false
    },
    series:[
      {
      name:'คนอยู่',
      data:[10,12,18,20,11,14]
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
