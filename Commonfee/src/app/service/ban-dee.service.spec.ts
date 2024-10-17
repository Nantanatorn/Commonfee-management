import { TestBed } from '@angular/core/testing';

import { BanDeeService } from './ban-dee.service';

describe('BanDeeService', () => {
  let service: BanDeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BanDeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
