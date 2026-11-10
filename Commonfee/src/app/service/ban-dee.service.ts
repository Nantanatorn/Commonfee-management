import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement, FeeRate, House, Income, Lastpaid, MonthlyPaymentData, MonthlyPetitionData, paymentHistory, PendingPayment, PetitionAdmin, PetitionHistory, PeymentForAdmin, Receipt, Resident, ResidentStatus } from '../model/model';
import { Userinfo } from '../model/user';

const api_URL = 'http://localhost:3500'; 

@Injectable({
  providedIn: 'root'
})
export class BanDeeService {

  constructor(private httpClient: HttpClient) { }

  getAllAnnouncement(): Observable<Announcement[]> {
    return this.httpClient.get<Announcement[]>(`${api_URL}/getannouce`);
  }

  getAllResident(): Observable<Resident[]>{
    return this.httpClient.get<Resident[]>(`${api_URL}/resident`);
  }

  getEmptyHouse(): Observable<House[]>{
    return this.httpClient.get<House[]>(`${api_URL}/gethouse`);
  }

  getResidentStatus(): Observable<ResidentStatus[]>{
    return this.httpClient.get<ResidentStatus[]>(`${api_URL}/housestatus`);
  }

  getPaymentHistory(token: string): Observable<paymentHistory[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.httpClient.get<paymentHistory[]>(`${api_URL}/paymenthistory`, { headers });
  }
  

  getPetitionUser(token: string): Observable<PetitionHistory[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.httpClient.get<PetitionHistory[]>(`${api_URL}/getpetition`, { headers });
  }

  getPetitionAdmin(): Observable<PetitionAdmin[]>{
    return this.httpClient.get<PetitionAdmin[]>(`${api_URL}/getpetitionAdmin`);
  }

  getUnpaid(): Observable<PeymentForAdmin[]>{
    return this.httpClient.get<PeymentForAdmin[]>(`${api_URL}/getunpaid`);
  }

  getPaid(): Observable<PeymentForAdmin[]>{
    return this.httpClient.get<PeymentForAdmin[]>(`${api_URL}/getpaid`);
  }

  getPending(): Observable<PendingPayment[]> {
    return this.httpClient.get<PendingPayment[]>(`${api_URL}/getpending`);
  }

  confirmPayment(payId: number): Observable<any> {
    return this.httpClient.put(`${api_URL}/confirmpay/${payId}`, {});
  }

  rejectPayment(payId: number): Observable<any> {
    return this.httpClient.put(`${api_URL}/rejectpay/${payId}`, {});
  }

  // เบอร์รับเงินและยอดเงินถูกกำหนดที่เซิร์ฟเวอร์ (จาก .env และตัวบิล) ส่งแค่เลขบิล
  generatePromptPayQr(payId: number): Observable<{ qrCodeUrl: string, amount: number }> {
    return this.httpClient.get<{ qrCodeUrl: string, amount: number }>(
      `${api_URL}/gpromptpay`, { params: { payId } }
    );
  }

  // ลูกบ้านแจ้งชำระพร้อมแนบสลิป (multipart/form-data -- ห้ามตั้ง Content-Type เอง)
  reportPayment(payId: number, slip: File): Observable<any> {
    const form = new FormData();
    form.append('slip', slip);
    return this.httpClient.put(`${api_URL}/pay/${payId}`, form);
  }

  // รูปสลิป (ต้อง login: เจ้าของบิลหรือ admin)
  getSlip(payId: number): Observable<Blob> {
    return this.httpClient.get(`${api_URL}/slip/${payId}`, { responseType: 'blob' });
  }

  updateResident(rid: number, body: { User_Firstname: string, User_Lastname: string, email: string, phone: string }): Observable<{ message: string }> {
    return this.httpClient.put<{ message: string }>(`${api_URL}/resident/${rid}`, body);
  }

  moveOutResident(rid: number): Observable<{ message: string }> {
    return this.httpClient.put<{ message: string }>(`${api_URL}/resident/${rid}/moveout`, {});
  }

  sendBill(): Observable<any> { const token = localStorage.getItem('token'); const headers = { 'Authorization': `Bearer ${token}` };
    return this.httpClient.post(`${api_URL}/sendBill`, {}, { headers });
  }

  updatePetition(petitionId: number): Observable<any> {
    const token = localStorage.getItem('token'); // รับ token จาก localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.httpClient.put(`${api_URL}/updatepetition/${petitionId}`, {}, { headers });
  }

  getMonthlyPaymentData(): Observable<MonthlyPaymentData[]> {
    return this.httpClient.get<MonthlyPaymentData[]>(`${api_URL}/monthly-payment`);
  }
  getMonthlyPetitionData(): Observable<MonthlyPetitionData[]> {
    return this.httpClient.get<MonthlyPetitionData[]>(`${api_URL}/monthly-petition`);
  }

  // รายชื่อลูกบ้านแบบแบ่งหน้า (search: ชื่อ นามสกุล บ้านเลขที่ อีเมล ชื่อผู้ใช้ เบอร์โทร เลขบัตรประชาชน)
  pageresident(page: number, limit: number, search: string = ''): Observable<{ currentPage: number, totalPages: number, totalItems: number, data: Resident[] }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.httpClient.get<{ currentPage: number, totalPages: number, totalItems: number, data: Resident[] }>(`${api_URL}/pageresident`, { params });
  }

  changeRate(body: { House_Size: string, Land_size: number, FeeRate: number, Fine: number }): Observable<any> {
    return this.httpClient.put(`${api_URL}/changerate`, body);
  }

  getFeeByHouseSize(houseSize: string): Observable<FeeRate[]> {
    return this.httpClient.get<FeeRate[]>(`${api_URL}/Fee`, { params: { House_Size: houseSize } });
  }
  getAllFee(): Observable<FeeRate[]> {
    return this.httpClient.get<FeeRate[]>(`${api_URL}/AllFee`);
  }
  sendUnpaidNotification(): Observable<any> {
    return this.httpClient.post(`${api_URL}/unpaidnoti`, {});
  }
  getReceiptByPayId(payId: number): Observable<Receipt[]> {
    return this.httpClient.get<Receipt[]>(`${api_URL}/getreceipt/${payId}`);
}
  getUserinfo(token: string): Observable<Userinfo[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.httpClient.get<Userinfo[]>(`${api_URL}/userinfo`, { headers });
  }
  getIncome(): Observable<Income[]>{
    return this.httpClient.get<Income[]>(`${api_URL}/getincome`);
  }
  getAllPetitionCount(): Observable<MonthlyPetitionData[]> {
    return this.httpClient.get<MonthlyPetitionData[]>(`${api_URL}/petitioncount`);
  }
  getLast(page: number, limit: number): Observable<{ currentPage: number, totalPages: number, totalItems: number, data: Lastpaid[] }> {
    return this.httpClient.get<{ currentPage: number, totalPages: number, totalItems: number, data: Lastpaid[] }>(
      `${api_URL}/paidhistory?page=${page}&limit=${limit}`
    );
  }

  searchPaymentHistory(month: number | null, year: number | null, token: string): Observable<paymentHistory[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    let params = new HttpParams();
    if (month) {
        params = params.set('month', month.toString());
    }
    if (year) {
        params = params.set('year', year.toString());
    }

    return this.httpClient.get<paymentHistory[]>(`${api_URL}/searchpayment`, { headers, params });
}

getNewsPage(page: number, limit: number): Observable<{ currentPage: number, totalPages: number, totalItems: number, data: Announcement[] }> {
  return this.httpClient.get<{ currentPage: number, totalPages: number, totalItems: number, data: Announcement[] }>(
    `${api_URL}/getpageannouce?page=${page}&limit=${limit}`
  );
}

}


  


