import { Component } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const thSarabunFontBase64 = 'data:font/ttf;base64,...';  
@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.css'
})
export class PurchaseComponent {
  myAngularxQrCode:any;
  constructor(){
    this.myAngularxQrCode = 'จ่ายมา 2500 บาท';
  }
  generatePDF(){
    const doc = new jsPDF();
  
       // เพิ่มฟอนต์ภาษาไทยที่แปลงมา
       doc.addFileToVFS('THSarabunNew.ttf', thSarabunFontBase64);
       doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
       doc.setFont('THSarabunNew', 'normal');

    // ตั้งค่าหัวข้อ
    doc.setFontSize(16);
    doc.text('เย็นสบาย แมนชั่น', 10, 10);
    doc.setFontSize(12);
    doc.text('234 ม.8 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', 10, 16);
    doc.text('อ.ศรีราชา จ.ชลบุรี 20230', 10, 22);
    doc.text('โทร: 038 - 352960-7', 10, 28);

    // ข้อมูลลูกค้า
    doc.setFontSize(12);
    doc.text('ชื่อ: คุณจันทนาฎ นี่ดวง', 10, 40);
    doc.text('ที่อยู่: 28/4 ม.4 ต.บางแสนสาย2 อ.เมือง จ.ชลบุรี', 10, 46);
    doc.text('โอนเข้าบัญชี: ณัฐ มัครมาก TTB 623-2-66107-1', 10, 52);
    doc.text('วันที่เริ่มคิดค่าบริการ: 25/08/24 00:00 - 25/09/24 00:00', 10, 58);

    // ข้อมูลการแจ้งหนี้
    doc.text('เลขที่: 00014219', 140, 40);
    doc.text('วันที่: 01/10/24 07:26', 140, 46);
    doc.text('ห้อง: 2316', 140, 52);

    // สร้างตารางรายการค่าใช้จ่าย
    const columns = ['ลำดับ', 'รายการ', 'จำนวน', 'ราคา', 'จำนวนเงิน', 'ภาษี', 'รวมเงิน'];
    const rows = [
      ['1', 'ค่าห้อง', '1', '1,900.00', '1,900.00', '0.00', '1,900.00'],
      ['2', 'ค่าไฟ 09202 - 09499', '297/6', '6.0/6.0', '1,782.00', '0.00', '1,782.00'],
      ['3', 'ค่าน้ำ 01173 - 01178', '5', '30.0', '150.00', '0.00', '150.00'],
      ['4', 'ค่าเช่าเฟอร์นิเจอร์', '1', '1,000.00', '1,000.00', '0.00', '1,000.00'],
      ['5', 'ค่าเช่าเครื่องปรับอากาศ', '1', '700.00', '700.00', '0.00', '700.00'],
      ['6', 'ค่าเช่าเครื่องทำน้ำอุ่น', '1', '500.00', '500.00', '0.00', '500.00'],
      ['7', 'ค่าส่วนกลาง', '1', '100.00', '100.00', '0.00', '100.00'],
      ['8', 'ค่าเน็ต', '1', '350.00', '350.00', '0.00', '350.00']
    ];

    // ใช้ jsPDF-AutoTable เพื่อสร้างตาราง
    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: 65, // กำหนดจุดเริ่มต้นของตาราง
      styles: { fontSize: 10 },
      headStyles: { fillColor: [150, 150, 150] }, // สีหัวตาราง
      margin: { left: 10, right: 10 },
    });

    // ยอดเงินรวม
    let finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text('ยอดเงินสุทธิ: 6,482.00', 140, finalY + 10);

    // ข้อความเพิ่มเติม
    doc.setFontSize(10);
    doc.text('* หักพันธบัตรแปลงสินสองบาทด่วน *', 10, finalY + 10);
    doc.save('bill.pdf');
  }
}

