import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'sign-in', component: SignInPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
