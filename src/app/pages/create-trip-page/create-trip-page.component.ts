import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { GoogleMapsService } from '../../services/google-maps.service';
import { environment } from '../../../environments/environment';
import { City } from '../../interfaces/city';

//declare var google: any;

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss'
})
export class CreateTripPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('startingLocationInput') startingLocationInput?: ElementRef<HTMLInputElement>;
  @ViewChild('departureDate') departureDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  autocompleteIntializationFlag: boolean = false;
  mapInitializationFlag: boolean = false;
  userHomeAddressFlag: boolean = false;
  currentStep: string = "no-modal";
  options: google.maps.MapOptions = {
    mapId: environment.googleMapId,
    center: { lat: 20, lng: 20 },
    zoom: 3,
    minZoom: 3,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    mapTypeControl: false
  }
  map: google.maps.Map | null = null;
  cityList: City[] = [];

  constructor(private googleMapsService: GoogleMapsService) {
  }

  ngOnInit(): void {
    this.currentStep = "no-modal";
  }

  ngAfterViewChecked(): void {
    this.googleMapsService.isScriptLoaded().subscribe({
      next: (loaded) => {
        if (loaded) {
          this.initializeMap();
          this.initializeModalLocationAutocomplete();
        } else {
          this.googleMapsService.loadScript();
        }
      },
      error: (error) => {
        // IMPORTANT: Add error handling
        console.error('Google Maps script not loaded.', error);
      }
    })
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

  private initializeMap(): void {
    if (!this.mapElement?.nativeElement || this.mapInitializationFlag) {
      return;
    }

    this.map = new google.maps.Map(this.mapElement!.nativeElement, this.options);
    const geocoder = new google.maps.Geocoder();

    this.map.addListener("click", async (event: google.maps.MapMouseEvent) => {
      const latlng = {
        lat: event.latLng!.lat(),
        lng: event.latLng!.lng()
      };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const city = results.find(result => result.types.includes('locality'));
          if (city) {
            const shortName = city.address_components
                                  .filter(x => x.types.includes('locality'))
                                  .at(0)
                                  ?.short_name;
            const countryName = city.address_components
                                    .filter(x => x.types.includes('country'))
                                    .at(0)
                                    ?.long_name;
            this.cityList.push(new City(shortName!, countryName!));

            let infoWindow = new google.maps.InfoWindow({
              content: `
              <body style="padding: 0; border: 0px;">
                <div style="background-color: #FFFDF3; width: 100%; height: 100%; margin: 0;">
                  <h1>${shortName}, ${countryName}</h1>
                  <button>Add city</button>
                </div>
              </body>
              `,
              position: latlng
            });
            infoWindow.open(this.map);
            console.log('Added to list:', shortName + ", " + countryName);
          }
        }
      })
    });

    this.mapInitializationFlag = true;
  }

  private initializeModalLocationAutocomplete(): void {
    if (this.currentStep === "create-from-scratch-screen" && this.startingLocationInput && !this.autocompleteIntializationFlag) {
      const googleAutocomplete = new google.maps.places.Autocomplete(this.startingLocationInput!.nativeElement);
      googleAutocomplete.addListener('place_changed', () => {
        let place = googleAutocomplete.getPlace();
        this.startingLocationInput!.nativeElement.value = place.formatted_address ?? "";
      })
      this.autocompleteIntializationFlag = true;
    } else if (this.currentStep !== "create-from-scratch-screen") {
      this.autocompleteIntializationFlag = false;
    }
  }
}
