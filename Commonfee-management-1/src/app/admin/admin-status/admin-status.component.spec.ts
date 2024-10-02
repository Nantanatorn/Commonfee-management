import { ComponentFixture, TestBed } from '@angular/core/testing';

import { statusAdminComponent } from './admin-status.component';

describe('statusAdminComponent', () => {
  let component: statusAdminComponent;
  let fixture: ComponentFixture<statusAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [statusAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(statusAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
