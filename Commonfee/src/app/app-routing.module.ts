import { HistoryReportComponent } from './user/history-report/history-report.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//user components
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';
import { ReportComponent } from './user/Residentreport/report.component';
import { StatusComponent } from './user/status/status.component';
import { ServiceComponent } from './user/Residentservice/service.component';
import { AboutUsComponent } from './user/about-us/about-us.component';
import { HomeComponent } from './user/home/home.component';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { HistoryPurchaseComponent } from './user/history-purchase/history-purchase.component';
import { CommonfeeStatusComponent } from './user/commonfee-status/commonfee-status.component';
import { BookRoomComponent } from './user/book-room/book-room.component';
import { FitnessComponent } from './user/fitness/fitness.component';
import { HistoryBookingComponent } from './user/history-booking/history-booking.component';


//admin components
import { loginAdminComponent } from './admin/login-admin/login-admin.component';
import { statusAdminComponent } from './admin/admin-status/admin-status.component';
import { AdminSidebarComponent } from './admin/admin-sidebar/admin-sidebar.component';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ResidentListComponent } from './admin/resident-list/resident-list.component';
import { PaymentComponent } from './admin/payment/payment.component';
import { ComplainRepairComponent } from './admin/complain-repair/complain-repair.component';
import { ChartsComponent } from './admin/charts/charts.component';

const routes: Routes = [
  // user routes
  { path: '', redirectTo: 'login', pathMatch: 'full' },  
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'report', component: ReportComponent },
  { path: 'status', component: StatusComponent },
  { path: 'service', component: ServiceComponent },
  { path: 'about-us', component: AboutUsComponent },
  {path:'historyPurchase',component:HistoryPurchaseComponent},
  {path:'historyReport',component:HistoryReportComponent},
  {path:'purchase',component:PurchaseComponent},
  {path:'commonfeeStatus',component:CommonfeeStatusComponent},
  {path:'bookRoom',component:BookRoomComponent},
  {path:'fitness',component:FitnessComponent},
  {path:'historyBooking',component:HistoryBookingComponent},
  // admin routes
  
  { path: 'adminlogin', component: loginAdminComponent },
  {path:'adminstatus',component:statusAdminComponent},
  {path:'adminsidebar',component:AdminSidebarComponent},
  {path:'adminhome',component:AdminHomeComponent},
  {path:'dashboard',component:DashboardComponent},
  {path:'residentList',component:ResidentListComponent},
  {path:'payment',component:PaymentComponent},
  {path:'complainRepair',component:ComplainRepairComponent},
  {path:'chart',component:ChartsComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
