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
import { ServiceComponent } from './user/Residentservice/service.component';
import { StatusComponent } from './user/status/status.component';
import { ReportComponent } from './user/Residentreport/report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HistoryPurchaseComponent } from './user/history-purchase/history-purchase.component';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { statusAdminComponent } from './admin/admin-status/admin-status.component';
import { SideServiceComponent } from './user/side-service/side-service.component';
import { AdminSidebarComponent } from './admin/admin-sidebar/admin-sidebar.component';
import { EditProfileComponent } from './user/edit-profile/edit-profile.component';
import { HistoryReportComponent } from './user/history-report/history-report.component';
import { ForgotpassComponent } from './user/forgotpass/forgotpass.component';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ResidentListComponent } from './admin/resident-list/resident-list.component';
import { PaymentComponent } from './admin/payment/payment.component';
import { ComplainRepairComponent } from './admin/complain-repair/complain-repair.component';
import { CommonfeeStatusComponent } from './user/commonfee-status/commonfee-status.component';
import { BookRoomComponent } from './user/book-room/book-room.component';
import { FitnessComponent } from './user/fitness/fitness.component';
import { HistoryBookingComponent } from './user/history-booking/history-booking.component';
import { ChartsComponent } from './admin/charts/charts.component';

import { HomeComponent } from './user/home/home.component';

import { ZXingScannerModule } from '@zxing/ngx-scanner';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    AboutUsComponent,
    ServiceComponent,
    StatusComponent,
    ReportComponent,
    HistoryPurchaseComponent,
    PurchaseComponent,
    statusAdminComponent,
    SideServiceComponent,
    AdminSidebarComponent,
    EditProfileComponent,
    HistoryReportComponent,
    ForgotpassComponent,
    AdminHomeComponent,
    DashboardComponent,
    ResidentListComponent,
    PaymentComponent,
    ComplainRepairComponent,
    CommonfeeStatusComponent,
    BookRoomComponent,
    FitnessComponent,
    HistoryBookingComponent,
    ChartsComponent,
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
