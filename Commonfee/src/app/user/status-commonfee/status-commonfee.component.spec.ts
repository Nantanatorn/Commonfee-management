import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusCommonfeeComponent } from './status-commonfee.component';

describe('StatusCommonfeeComponent', () => {
  let component: StatusCommonfeeComponent;
  let fixture: ComponentFixture<StatusCommonfeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusCommonfeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusCommonfeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
