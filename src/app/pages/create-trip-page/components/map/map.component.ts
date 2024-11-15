import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { OverlayFactoryService } from '../../../../services/overlay-factory.service';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit {
  @Input() options: google.maps.MapOptions = {};
  @Output() cityAdded = new EventEmitter<{ city: CityTransferDto }>();
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  map: google.maps.Map | null = null;
  private mapInitializationFlag: boolean = false;
  private cityOverlay: any | undefined = undefined;

  private cityClickListener: google.maps.MapsEventListener | undefined = undefined;

  constructor(
    private googleMapsService: GoogleMapsService,
    private overlayFactoryService: OverlayFactoryService
  ) { }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.googleMapsService.loadScriptAsync();
      await this.googleMapsService.getOverlayViewAsync();
      this.initializeMap();
    } catch (error) {
      console.error('Error loading Google Maps script:', error);
    }
  }

  private initializeMap(): void {
    if (!this.mapElement?.nativeElement || this.mapInitializationFlag) {
      return;
    }

    this.map = new google.maps.Map(this.mapElement!.nativeElement, this.options);
    const geocoder = new google.maps.Geocoder();

    this.cityClickListener = this.map.addListener("click",
      async (event: google.maps.MapMouseEvent) => {
        event.stop();
        this.drawCityOverlayAsync(event, geocoder);
      });

    this.mapInitializationFlag = true;
  }

  private drawCityOverlayAsync(event: google.maps.MapMouseEvent, geocoder: google.maps.Geocoder) {
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

      if (this.cityOverlay) {
        this.cityOverlay.setMap(null);
      }

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

      const cityObject = new CityTransferDto(shortName!, countryName!, latitude, longitude);

      this.cityOverlay = this.overlayFactoryService.createCityOverlay(
        { lat: latitude, lng: longitude },
        cityObject,
        this.cityAdded);

      this.cityOverlay.setMap(this.map);
    });
  }
}