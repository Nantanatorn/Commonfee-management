import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonfeeStatusComponent } from './commonfee-status.component';

describe('CommonfeeStatusComponent', () => {
  let component: CommonfeeStatusComponent;
  let fixture: ComponentFixture<CommonfeeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonfeeStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonfeeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
