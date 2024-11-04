import { Component, OnInit } from '@angular/core';

interface Booking {
  date: string;
  timeSlot: string;
  status: string;
}

@Component({
  selector: 'app-history-booking',
  templateUrl: './history-booking.component.html',
  styleUrl: './history-booking.component.css'
})
export class HistoryBookingComponent implements OnInit{
  bookingHistory: Booking[] = [];

  constructor() { }

  ngOnInit(): void {
    // ดึงข้อมูลประวัติการจองจาก localStorage หรือแหล่งข้อมูลอื่น
    const storedHistory = localStorage.getItem('bookingHistory');
    if (storedHistory) {
      this.bookingHistory = JSON.parse(storedHistory);
    }
  }

  cancelBooking(booking: Booking): void {
    // ลบการจองออกจากประวัติ
    const index = this.bookingHistory.indexOf(booking);
    if (index !== -1) {
      this.bookingHistory.splice(index, 1);
      // อัปเดต localStorage
      localStorage.setItem('bookingHistory', JSON.stringify(this.bookingHistory));
      alert(`ยกเลิกการจองวันที่ ${booking.date} เรียบร้อยแล้ว`);
    }
  }
}