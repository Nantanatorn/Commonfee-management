import { ComponentFixture, TestBed } from '@angular/core/testing';

import { homeAdminComponent } from './home-admin.component';

describe('homeAdminComponent', () => {
  let component: homeAdminComponent;
  let fixture: ComponentFixture<homeAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [homeAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(homeAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
