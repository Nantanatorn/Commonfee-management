import { Component, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-service',
  templateUrl: './side-service.component.html',
  styleUrl: './side-service.component.css'
})
export class SideServiceComponent implements OnInit {

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {}

  

 
}

