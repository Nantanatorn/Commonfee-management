import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-fitness',
  templateUrl: './fitness.component.html',
  styleUrl: './fitness.component.css'
})
export class FitnessComponent implements OnInit{
  selectedDate: string = '';
  selectedTimeSlot: string = '';
  bookingStatus: string = '';

  timeSlots: string[] = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00'
  ];

  constructor() { }

  ngOnInit(): void { }

  bookFitness() {
    if (this.selectedDate && this.selectedTimeSlot) {
      this.bookingStatus = `คุณได้ทำการจองคิวฟิตเนสในวันที่ ${this.selectedDate} ช่วงเวลา ${this.selectedTimeSlot} เรียบร้อยแล้ว`;
    } else {
      this.bookingStatus = 'กรุณาเลือกวันที่และช่วงเวลาก่อนทำการจอง';
    }
  }

}