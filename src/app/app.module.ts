import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs'; 

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SignInPageComponent } from './pages/sign-in-page/sign-in-page.component';
import { DahsboardPageComponent } from './pages/dahsboard-page/dahsboard-page.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TripPageComponent } from './pages/trip-page/trip-page.component';
import { MapComponent } from './pages/trip-page/components/map/map.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { CreateTripModalComponent } from './pages/trip-page/components/create-trip-modal/create-trip-modal.component';
import { PanelComponent } from './pages/trip-page/components/city-list-panel/panel.component';
import { TripStateService } from './pages/trip-page/services/trip-state.service';
import { CityListComponent } from './pages/trip-page/components/city-list-panel/components/city-list/city-list.component';
import { CityFormComponent } from './pages/trip-page/components/city-list-panel/components/city-form/city-form.component';
import { WaypointListComponent } from './pages/trip-page/components/city-list-panel/components/waypoint-list/waypoint-list.component';
import { WaypointFormComponent } from './pages/trip-page/components/city-list-panel/components/waypoint-form/waypoint-form.component';
import { HeaderComponent } from './pages/trip-page/components/city-list-panel/components/header/header.component';
import { TripService } from './services/trip.service';
import { HttpClientModule } from '@angular/common/http';
import { TokenRefreshService } from './services/token-refresh.service';
import { MyTripsPageComponent } from './pages/my-trips-page/my-trips-page.component';
import { ModalService } from './services/modal.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { TripPanelComponent } from './shared/components/trip-panel/trip-panel.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import { CreatePostModalComponent } from './shared/components/create-post-modal/create-post-modal.component';
import { ImageSelectionSectionComponent } from './shared/components/create-post-modal/components/image-selection-section/image-selection-section.component';
import { ImageViewComponent } from './shared/components/image-view/image-view.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomePageComponent,
    SignInPageComponent,
    DahsboardPageComponent,
    SidebarComponent,
    TripPageComponent,
    MapComponent,
    CreateTripModalComponent,
    PanelComponent,
    CityListComponent,
    CityFormComponent,
    CityListComponent,
    WaypointListComponent,
    WaypointFormComponent,
    HeaderComponent,
    MyTripsPageComponent,    ModalComponent,
    AccountPageComponent,
    ProfilePageComponent,
    TripPanelComponent,
    SnackbarComponent,
    CreatePostModalComponent,
    ImageSelectionSectionComponent,
    ImageViewComponent
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
    MatProgressBarModule,
    MatTabsModule,
    GoogleMapsModule,
    HttpClientModule
  ],
  providers: [TripService, TripStateService, TokenRefreshService, ModalService],
  bootstrap: [AppComponent],
})
export class AppModule {}
