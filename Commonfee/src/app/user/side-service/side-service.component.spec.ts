import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideServiceComponent } from './side-service.component';

describe('SideServiceComponent', () => {
  let component: SideServiceComponent;
  let fixture: ComponentFixture<SideServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SideServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
