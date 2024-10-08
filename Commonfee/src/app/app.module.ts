import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import{QRCodeModule} from 'angularx-qrcode';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { HeaderComponent } from './user/header/header.component';
import { AboutUsComponent } from './user/about-us/about-us.component';
import { ServiceComponent } from './user/service/service.component';
import { StatusComponent } from './user/status/status.component';
import { ReportComponent } from './user/report/report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from './user/sidebar/sidebar.component';
import { HistoryPurchaseComponent } from './user/history-purchase/history-purchase.component';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { statusAdminComponent } from './admin/admin-status/admin-status.component';
import { homeAdminComponent } from './admin/home-admin/home-admin.component';
import { SideServiceComponent } from './side-service/side-service.component';
import { StatusCommonfeeComponent } from './user/status-commonfee/status-commonfee.component';
import { AdminSidebarComponent } from './admin/admin-sidebar/admin-sidebar.component';
import { EditProfileComponent } from './user/edit-profile/edit-profile.component';
import { ForgotpassComponent } from './user/forgotpass/forgotpass.component';

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
    SidebarComponent,
    HistoryPurchaseComponent,
    PurchaseComponent,
    statusAdminComponent,
    homeAdminComponent,
    SideServiceComponent,
    StatusCommonfeeComponent,
    AdminSidebarComponent,
    EditProfileComponent,
    ForgotpassComponent
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,  
    ReactiveFormsModule,  
    HttpClientModule,
    QRCodeModule,
    CommonModule
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
