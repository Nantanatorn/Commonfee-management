import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import{QRCodeModule} from 'angularx-qrcode';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { ChartModule } from 'angular-highcharts';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { HeaderComponent } from './user/header/header.component';
import { AboutUsComponent } from './user/about-us/about-us.component';
import { ReportComponent } from './user/Residentreport/report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { statusAdminComponent } from './admin/admin-status/admin-status.component';
import { AdminSidebarComponent } from './admin/admin-sidebar/admin-sidebar.component';
import { EditProfileComponent } from './user/edit-profile/edit-profile.component';
import { ForgotpassComponent } from './user/forgotpass/forgotpass.component';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ResidentListComponent } from './admin/resident-list/resident-list.component';
import { PaymentComponent } from './admin/payment/payment.component';
import { ComplainRepairComponent } from './admin/complain-repair/complain-repair.component';

import { HomeComponent } from './user/home/home.component';

import { ZXingScannerModule } from '@zxing/ngx-scanner';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    AboutUsComponent,
    ReportComponent,
    PurchaseComponent,
    statusAdminComponent,
    AdminSidebarComponent,
    EditProfileComponent,
    ForgotpassComponent,
    AdminHomeComponent,
    DashboardComponent,
    ResidentListComponent,
    PaymentComponent,
    ComplainRepairComponent,
    HomeComponent
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,  
    ReactiveFormsModule,  
    HttpClientModule,
    QRCodeModule,
    CommonModule,
    GoogleMapsModule,
    ChartModule,
    ZXingScannerModule
    
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
