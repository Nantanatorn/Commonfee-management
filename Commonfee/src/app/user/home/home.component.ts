import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Announcement } from '../../model/model';
import { BanDeeService } from '../../service/ban-dee.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  Announcements : Observable<Announcement[]> | undefined;

  constructor(private banservice : BanDeeService,
              
  ){}

  ngOnInit(): void{
    this.Announcements = this.banservice.getAllAnnouncement();
  }
}
