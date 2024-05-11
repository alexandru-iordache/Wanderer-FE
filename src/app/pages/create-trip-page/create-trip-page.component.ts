import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { GoogleMapsService } from '../../services/google-maps.service';

//declare var google: any;

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss'
})
export class CreateTripPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('startingLocationInput') startingLocationInput?: ElementRef<HTMLInputElement>;
  @ViewChild('departureDate') departureDateInput?: ElementRef<HTMLInputElement>;
  //@ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  autocompleteIntializationFlag: boolean = false;
  userHomeAddressFlag: boolean = false;
  currentStep: string = "no-modal";
  options: google.maps.MapOptions = {
    mapId: "891ee26853c57f4",
    center: { lat: 20, lng: 20 },
    zoom: 3,
    minZoom: 3,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    mapTypeControl: false
  }

  constructor(private googleMapsService: GoogleMapsService) {
  }

  ngOnInit(): void {
    this.googleMapsService.isScriptLoaded().subscribe({
      next: (loaded) => {
        if (loaded) {
          
        }
      },
      error: (error) => {
        // IMPORTANT: Add error handling
        console.error('Google Maps script not loaded.', error);
      }
    })

    this.currentStep = "no-modal";
  }

  ngAfterViewChecked(): void {
    if (this.currentStep === "create-from-scratch-screen" && this.startingLocationInput && !this.autocompleteIntializationFlag) {
      this.googleMapsService.isScriptLoaded().subscribe({
        next: (loaded) => {
          if (loaded) {
            this.setLocationAutocomplete();
            this.autocompleteIntializationFlag = true;
          }
        },
        error: (error) => {
          // IMPORTANT: Add error handling
          console.error('Google Maps script not loaded.', error);
        }
      })
    } else if (this.currentStep !== "create-from-scratch-screen") {
      this.autocompleteIntializationFlag = false;
    }
  }

  setCurrentStep(screen: string): void {
    this.currentStep = screen;
  }

  setUserHomeAddress(): void {
    this.userHomeAddressFlag = !this.userHomeAddressFlag;
    if (this.userHomeAddressFlag) {
      // IMPORTANT: Add user location
      this.startingLocationInput!.nativeElement.value = 'User Home Address';
    } else {
      this.startingLocationInput!.nativeElement.value = '';
    }
  }

  createTrip(): void {
    console.log("hello");
    this.currentStep = "no-modal";
  }

  private setLocationAutocomplete(): void {
    const googleAutocomplete = new google.maps.places.Autocomplete(this.startingLocationInput!.nativeElement);
    googleAutocomplete.addListener('place_changed', () => {
      let place = googleAutocomplete.getPlace();

      this.startingLocationInput!.nativeElement.value = place.formatted_address ?? "";
    })
  }
}
