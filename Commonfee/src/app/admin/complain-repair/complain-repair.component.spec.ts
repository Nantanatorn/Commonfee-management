import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplainRepairComponent } from './complain-repair.component';

describe('ComplainRepairComponent', () => {
  let component: ComplainRepairComponent;
  let fixture: ComponentFixture<ComplainRepairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplainRepairComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplainRepairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
