import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loginGuard, roleGuard } from '../auth.guard';

//user components
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';
import { ReportComponent } from './user/Residentreport/report.component';
import { AboutUsComponent } from './user/about-us/about-us.component';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { EditProfileComponent } from './user/edit-profile/edit-profile.component';

//admin components
import { statusAdminComponent } from './admin/admin-status/admin-status.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { ResidentListComponent } from './admin/resident-list/resident-list.component';
import { PaymentComponent } from './admin/payment/payment.component';
import { ComplainRepairComponent } from './admin/complain-repair/complain-repair.component';
import { HomeComponent } from './user/home/home.component';
import { ForgotpassComponent } from './user/forgotpass/forgotpass.component';

const admin = roleGuard('admin');

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // สาธารณะ
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgotpass', component: ForgotpassComponent },
  { path: 'about-us', component: AboutUsComponent },

  // ต้อง login (ลูกบ้าน)
  { path: 'home', component: HomeComponent, canActivate: [loginGuard] },
  { path: 'report', component: ReportComponent, canActivate: [loginGuard] },
  { path: 'purchase', component: PurchaseComponent, canActivate: [loginGuard] },
  { path: 'editprofile', component: EditProfileComponent, canActivate: [loginGuard] },

  // admin เท่านั้น
  { path: 'adminstatus', component: statusAdminComponent, canActivate: [admin] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [admin] },
  { path: 'residentList', component: ResidentListComponent, canActivate: [admin] },
  { path: 'payment', component: PaymentComponent, canActivate: [admin] },
  { path: 'complainRepair', component: ComplainRepairComponent, canActivate: [admin] },

  // path ที่ไม่มีอยู่จริง
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
