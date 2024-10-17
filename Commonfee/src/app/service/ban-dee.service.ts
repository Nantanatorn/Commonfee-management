import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement } from '../model/model';

const api_URL = 'http://localhost:3500'; 

@Injectable({
  providedIn: 'root'
})
export class BanDeeService {

  constructor(private httpClient: HttpClient) { }

  getAllAnnouncement(): Observable<Announcement[]> {
    return this.httpClient.get<Announcement[]>(`${api_URL}/getannouce`);
  }
}
