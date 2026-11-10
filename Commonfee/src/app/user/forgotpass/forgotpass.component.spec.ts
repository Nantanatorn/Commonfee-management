import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { ForgotpassComponent } from './forgotpass.component';

describe('ForgotpassComponent', () => {
  let component: ForgotpassComponent;
  let fixture: ComponentFixture<ForgotpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ForgotpassComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accepts a 6-digit verification code', () => {
    component.changePassForm.patchValue({
      identifier: 'user1',
      code: '123456',
      password: 'abcdef',
      confirmPassword: 'abcdef',
    });
    expect(component.changePassForm.get('code')?.valid).toBeTrue();
    expect(component.changePassForm.valid).toBeTrue();
  });

  it('rejects codes that are not exactly 6 digits', () => {
    const code = component.changePassForm.get('code')!;
    for (const bad of ['', '12345', '1234567', 'abcdef', 'dddddd', '12 456']) {
      code.setValue(bad);
      expect(code.valid).withContext(`"${bad}"`).toBeFalse();
    }
  });
});
