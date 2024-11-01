import { BanDeeService } from './../../service/ban-dee.service';
import { Component } from '@angular/core';
import {Chart} from 'angular-highcharts';
import { Observable } from 'rxjs';
import { MonthlyPetitionData, PetitionAdmin } from '../../model/model';

@Component({
  selector: 'app-complain-repair',
  templateUrl: './complain-repair.component.html',
  styleUrl: './complain-repair.component.css'
})
export class ComplainRepairComponent {

  petitionadmin : Observable< PetitionAdmin[]> | undefined;
  lineCharts: Chart | undefined;

  constructor(private bandeeservice : BanDeeService,){}

  ngOnInit(): void {
    this.loadPetitions();
    this.fetchMonthlyPetitionData();
  }

  loadPetitions(): void {
    // โหลดข้อมูลร้องเรียนผ่าน bandeeservice
    this.petitionadmin = this.bandeeservice.getPetitionAdmin();
  }

  updatePetitionStatus(petitionId: number) {
    this.bandeeservice.updatePetition(petitionId).subscribe({
      next: (response) => {
        console.log('Petition updated:', response);
        
        this.loadPetitions(); // โหลดข้อมูลใหม่เพื่อแสดงผลอัปเดตในตาราง
      },
      error: (err) => {
        console.error('Error updating petition:', err);
        
      }
    });
  }

  fetchMonthlyPetitionData(): void {
    this.bandeeservice.getMonthlyPetitionData().subscribe(
      (data: MonthlyPetitionData[]) => {
        this.createMonthlyChart(data);
      },
      (error) => {
        console.error('Error fetching monthly petition data:', error);
      }
    );
  }
  
  createMonthlyChart(data: MonthlyPetitionData[]): void {
    const months = data.map((item) => item.petition_Date); // เปลี่ยนชื่อ 'month' เป็น 'months' ให้ชัดเจน
    const repairData = data.map((item) => item.Repair_Count); // ใช้ camelCase แทน
    const normalData = data.map((item) => item.Normal_Count);
  
    this.lineCharts = new Chart({
      chart: {
        type: 'line',
        style: {
          fontFamily: 'Noto Sans Thai, sans-serif',
        },
      },
      title: {
        text: 'แสดงคำร้องในแต่ละเดือน',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: months,
        title: {
          text: 'เดือน',
        },
      },
      yAxis: {
        title: {
          text: 'จำนวนคำร้อง',
        },
      },
      series: [
        {
          name: 'คำร้องซ่อม',
          data: repairData,
        } as any,
        {
          name: 'คำร้องทั่วไป',
          data: normalData,
        } as any,
      ],
    });
  }
}