import { Component, Input } from '@angular/core';
import { BanDeeService } from '../../service/ban-dee.service';
import { AuthService } from '../../service/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PetitionHistory } from '../../model/model';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {
  
  petitionHistory$! : Observable<PetitionHistory[]>

  constructor(private http: HttpClient , 
              private authService : AuthService , 
              private banDeeService: BanDeeService){}
  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
     
      this.petitionHistory$ = this.banDeeService.getPetitionUser(token);
    } else {
      console.error('No token found. Please login first.');
    }
  }


}
