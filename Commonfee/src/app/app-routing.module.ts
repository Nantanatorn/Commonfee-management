import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//user components
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';
import { ReportComponent } from './user/report/report.component';
import { StatusComponent } from './user/status/status.component';
import { ServiceComponent } from './user/service/service.component';
import { AboutUsComponent } from './user/about-us/about-us.component';
import { HomeComponent } from './user/home/home.component';

//admin components
import { homeAdminComponent } from './admin/home-admin/home-admin.component';
import { loginAdminComponent } from './admin/login-admin/login-admin.component';
import { SidebarComponent } from './user/sidebar/sidebar.component';
import { HistoryPurchaseComponent } from './user/history-purchase/history-purchase.component';
import { PurchaseComponent } from './user/purchase/purchase.component';
import { statusAdminComponent } from './admin/admin-status/admin-status.component';

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
  {path:'sidebar',component:SidebarComponent},
  {path:'historyPurchase',component:HistoryPurchaseComponent},
  {path:'purchase',component:PurchaseComponent},

  // admin routes
  { path: 'adminhome', component: homeAdminComponent },
  { path: 'adminlogin', component: loginAdminComponent },
  {path:'adminstatus',component:statusAdminComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
