import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { GoogleComponentsFactoryService } from '../../../../services/google-componets-factory.service';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../../interfaces/dtos/add-city-dto';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() options: google.maps.MapOptions = {};
  @Input() cityList: AddCityDto[] = [];
  @Output() cityToAdd = new EventEmitter<{ city: CityTransferDto }>();
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  map: google.maps.Map | null = null;
  private mapInitializationFlag: boolean = false;
  private cityOverlay: any | undefined = undefined;

  private cityClickListener: google.maps.MapsEventListener | undefined =
    undefined;

  constructor(
    private googleMapsService: GoogleMapsService,
    private googleComponentsFactoryService: GoogleComponentsFactoryService,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.googleMapsService.loadScriptAsync();
      await this.googleMapsService.getOverlayViewAsync();
      await this.googleMapsService.getMarkerAsync();
      this.initializeMap();
      this.updateMarkers();
    } catch (error) {
      console.error('Error loading Google Maps script:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cityList']) {
      this.updateMarkers();
      this.changeDetector.detectChanges();
    }
  }

  private initializeMap(): void {
    if (!this.mapElement?.nativeElement || this.mapInitializationFlag) {
      return;
    }

    this.map = new google.maps.Map(
      this.mapElement!.nativeElement,
      this.options
    );
    const geocoder = new google.maps.Geocoder();

    this.cityClickListener = this.map.addListener(
      'click',
      async (event: google.maps.MapMouseEvent) => {
        event.stop();
        this.drawCityOverlayAsync(event, geocoder);
      }
    );

    this.mapInitializationFlag = true;
  }

  private drawCityOverlayAsync(
    event: google.maps.MapMouseEvent,
    geocoder: google.maps.Geocoder
  ) {
    const latlng = {
      lat: event.latLng!.lat(),
      lng: event.latLng!.lng(),
    };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status !== 'OK' || results === null || results[0] === null) {
        // IMPORTANT: Add error snackbar or something
        console.log(
          'Response status not equal with ok from Google Geocode API.'
        );
        return;
      }

      const city = results.find((result) => result.types.includes('locality'));
      if (city === undefined) {
        // IMPORTANT: Add error snackbar or something
        console.log('No locality found in the results[] response.');
        return;
      }

      if (this.cityOverlay) {
        this.cityOverlay.setMap(null);
      }

      const shortName = city.address_components
        .filter((x) => x.types.includes('locality'))
        .at(0)?.long_name;
      const countryName = city.address_components
        .filter((x) => x.types.includes('country'))
        .at(0)?.long_name;
      const latitude = city.geometry?.location?.lat() ?? 0;
      const longitude = city.geometry?.location?.lng() ?? 0;

      var northEastBound = city.geometry?.viewport?.getNorthEast();
      var southWestBound = city.geometry?.viewport?.getSouthWest();

      if (northEastBound === undefined || southWestBound === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      const cityObject = new CityTransferDto(
        shortName!,
        countryName!,
        latitude,
        longitude,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng())
      );

      this.cityOverlay = this.googleComponentsFactoryService.createCityOverlay(
        { lat: latitude, lng: longitude },
        cityObject,
        this.cityToAdd
      );

      this.cityOverlay.setMap(this.map);
    });
  }

  private updateMarkers(): void {
    if (this.map) {
      this.cityList.forEach((addCityDto, index) => {
        this.googleComponentsFactoryService.createCityMarker(
          this.map!,
          { lat: addCityDto.latitude, lng: addCityDto.longitude },
          addCityDto,
          undefined,
          (city) => {
            console.log(`Marker clicked for city: ${city.name}`);
          },
          index + 1
        );
      });
    }
  }
}
