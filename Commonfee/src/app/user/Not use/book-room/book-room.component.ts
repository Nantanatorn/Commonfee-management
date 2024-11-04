import { Component } from '@angular/core';

@Component({
  selector: 'app-book-room',
  templateUrl: './book-room.component.html',
  styleUrls: ['./book-room.component.css']
})
export class BookRoomComponent {
  rooms: string[] = ['ห้องประชุม', 'ห้องจัดเลี้ยง', 'สนามกีฬา', 'ห้องสันทนาการ'];
  
  booking = {
    room: '',
    date: '',
    time: '',
    duration: ''
  };

  onSubmit() {
    if (this.booking.room && this.booking.date && this.booking.time && this.booking.duration) {
      alert(`จองห้อง ${this.booking.room} สำเร็จ! \nวันที่: ${this.booking.date} \nเวลา: ${this.booking.time} \nระยะเวลา: ${this.booking.duration} ชั่วโมง`);
    } else {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  }
}
