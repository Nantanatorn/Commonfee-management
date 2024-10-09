import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  services: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.http.get<any>('http://your-backend-url/api/services')
      .subscribe(data => {
        this.services = data;
      }, error => console.error('Could not load services!', error));
  }

  getDetails(id: number) {
    // เรียก API เพื่อดูรายละเอียดบริการ
    this.http.get<any>(`http://your-backend-url/api/services/${id}`)
      .subscribe(detail => {
        console.log('Service Details: ', detail);
      }, error => console.error('Could not load service details!', error));
  }
}
