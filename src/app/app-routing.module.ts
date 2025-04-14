import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';
import { DahsboardPageComponent } from './pages/dahsboard-page/dahsboard-page.component';
import { authGuard, nonAuthGuard } from './shared/helpers/auth.guard';
import { TripPageComponent } from './pages/trip-page/trip-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent, canActivate: [nonAuthGuard] },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [nonAuthGuard] },
  { path: 'dashboard', component: DahsboardPageComponent, canActivate: [authGuard] },
  { path: 'trip', component: TripPageComponent, canActivate: [authGuard] },
  { path: 'trip/:id', component: TripPageComponent, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
