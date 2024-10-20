import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement, House, paymentHistory, Resident, ResidentStatus } from '../model/model';

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
}


