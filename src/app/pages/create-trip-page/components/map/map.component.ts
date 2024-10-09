import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { City } from '../../../../interfaces/city';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit {
  @Input() options: google.maps.MapOptions = {};
  @Output() cityAdded = new EventEmitter<{ city: City }>();
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  map: google.maps.Map | null = null;
  private mapInitializationFlag: boolean = false;
  private infoWindow: google.maps.InfoWindow | undefined = undefined;

  ngAfterViewInit(): void {
    this.initializeMap();
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
        if (status !== 'OK' || results === null || results[0] === null) {
          // IMPORTANT: Add error snackbar or something
          console.log("Response status not equal with ok from Google Geocode API.");
          return;
        }

        const city = results.find(result => result.types.includes('locality'));
        if (city === undefined) {
          // IMPORTANT: Add error snackbar or something
          console.log("No locality found in the results[] response.");
          return;
        }

        this.infoWindow?.close();

        const shortName = city.address_components
          .filter(x => x.types.includes('locality'))
          .at(0)
          ?.short_name;
        const countryName = city.address_components
          .filter(x => x.types.includes('country'))
          .at(0)
          ?.long_name;
        const latitude = city.geometry?.location?.lat() ?? 0;
        const longitude = city.geometry?.location?.lng() ?? 0;

        this.infoWindow = new google.maps.InfoWindow({
          content: `
              <body style="padding: 0; border: 0px;">
                <div style="background-color: #FFFDF3; width: 100%; height: 100%; margin: 0;">
                  <h1>${shortName}, ${countryName}</h1>
                  <button id="add-city-btn">Add city</button>
                </div>
              </body>
              `,
          position: latlng
        });
        this.infoWindow.open(this.map);

        google.maps.event.addListener(this.infoWindow, 'domready', () => {
          const button = document.getElementById('add-city-btn');
          if (button) {
            button.addEventListener('click', () => {
              let city = new City(shortName!, countryName!, latitude, longitude);
              this.cityAdded.emit({ city: city });
              console.log("City Added Event emitted.");
            })
          }
        })
      })
    });

    this.mapInitializationFlag = true;
  }
}
