import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';
import { DahsboardPageComponent } from './pages/dahsboard-page/dahsboard-page.component';
import { authGuard, nonAuthGuard } from './shared/helpers/auth.guard';
import { CreateTripPageComponent } from './pages/create-trip-page/create-trip-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent, canActivate: [nonAuthGuard] },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [nonAuthGuard] },
  { path: 'dashboard', component: DahsboardPageComponent, canActivate: [authGuard] },
  { path: 'create-trip', component: CreateTripPageComponent, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
