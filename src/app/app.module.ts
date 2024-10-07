import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';
import { DahsboardPageComponent } from './pages/dahsboard-page/dahsboard-page.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { CreateTripPageComponent } from './pages/create-trip-page/create-trip-page.component';
import { MapComponent } from './pages/create-trip-page/components/map/map.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { CreateTripModalComponent } from './pages/create-trip-page/components/create-trip-modal/create-trip-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomePageComponent,
    SignInPageComponent,
    DahsboardPageComponent,
    SidebarComponent,
    CreateTripPageComponent,
    MapComponent,
    CreateTripModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    GoogleMapsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
