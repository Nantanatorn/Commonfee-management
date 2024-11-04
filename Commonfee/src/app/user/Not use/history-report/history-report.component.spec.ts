import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryReportComponent } from './history-report.component';

describe('HistoryReportComponent', () => {
  let component: HistoryReportComponent;
  let fixture: ComponentFixture<HistoryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoryReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
