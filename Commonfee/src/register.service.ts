import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private baseUrl = 'http://localhost:3000/register'; // URL ของ API ที่จะเรียกใช้

  constructor(private http: HttpClient) { }

  // ฟังก์ชันสำหรับส่งข้อมูลการลงทะเบียนผู้ใช้
  registerUser(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Sending registration request to:', this.baseUrl);
    console.log('Request body:', userData);

    return this.http.post(this.baseUrl, userData, { headers }).pipe(
      tap(response => {
        console.log('Registration response:', response);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(error);
      })
    );
  }
}