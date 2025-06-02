import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { authGuard, nonAuthGuard } from './shared/helpers/auth.guard';
import { TripPageComponent } from './pages/trip-page/trip-page.component';
import { MyTripsPageComponent } from './pages/my-trips-page/my-trips-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent, canActivate: [nonAuthGuard] },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [nonAuthGuard] },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'trip', component: TripPageComponent, canActivate: [authGuard] },
  { path: 'trip/:id', component: TripPageComponent, canActivate: [authGuard] },
  { path: 'my-trips', component: MyTripsPageComponent, canActivate: [authGuard] },
  { path: 'account/:id', component: AccountPageComponent, canActivate: [authGuard] },
  { path: 'profile/:id', component: ProfilePageComponent, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
