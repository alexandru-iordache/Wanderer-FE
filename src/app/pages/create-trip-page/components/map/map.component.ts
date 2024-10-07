import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit {
  @Input() options: google.maps.MapOptions = {};
  @Output() cityAdded = new EventEmitter<{ city: string, country: string }>();
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  private mapInitializationFlag: boolean = false;
  map: google.maps.Map | null = null;

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

            let infoWindow = new google.maps.InfoWindow({
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
            infoWindow.open(this.map);
            console.log('Added to list:', shortName + ", " + countryName);

            google.maps.event.addListener(infoWindow, 'addCityEvent', () => {
              const button = document.getElementById('add-city-btn');
              if(button){
                button.addEventListener('click', () => {
                  button.addEventListener('click', () => {
                    this.cityAdded.emit({ city: shortName!, country: countryName!})
                  })
                })
              }
            })
          }
        }
      })
    });

    this.mapInitializationFlag = true;
  }
}
