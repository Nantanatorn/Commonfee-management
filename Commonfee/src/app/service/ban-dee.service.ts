import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement, House, MonthlyPaymentData, paymentHistory, PetitionAdmin, PetitionHistory, PeymentForAdmin, Resident, ResidentStatus } from '../model/model';

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

  generatePromptPayQr(phoneNumber: string, amount: number, payId: number): Observable<{ qrCodeUrl: string }> {
    return this.httpClient.get<{ qrCodeUrl: string }>(
      `${api_URL}/gpromptpay?phoneNumber=${phoneNumber}&amount=${amount}&payId=${payId}`
    );
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


  
}

