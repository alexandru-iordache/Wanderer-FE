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
import { SelectedCityDto } from '../../../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../../../interfaces/dtos/add-waypoint-dto';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() options: google.maps.MapOptions = {};
  @Input() cityList: AddCityDto[] = [];
  @Input() selectedCity: SelectedCityDto | null = null;
  @Input() currentDayIndex: number = 0;
  @Output() cityToAdd = new EventEmitter<{ city: CityTransferDto }>();
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  map: google.maps.Map | null = null;
  private mapInitializationFlag: boolean = false;
  private cityOverlay: any | undefined = undefined;
  private cityMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private waypointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private geocoder: google.maps.Geocoder;

  private cityClickListener: google.maps.MapsEventListener | null = null;

  constructor(
    private googleMapsService: GoogleMapsService,
    private googleComponentsFactoryService: GoogleComponentsFactoryService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.geocoder = new google.maps.Geocoder();
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.googleMapsService.loadScriptAsync();
      await this.googleMapsService.getOverlayViewAsync();
      await this.googleMapsService.getMarkerAsync();
      this.initializeMap();
      this.initializeCityClickListener();
      this.renderCityMarkers();
    } catch (error) {
      console.error('Error loading Google Maps script:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cityList']) {
      if (this.selectedCity !== null) {
        this.removeMarkers(this.waypointMarkers);
        this.renderWaypointMarkers();
      } else {
        this.removeMarkers(this.cityMarkers);
        this.renderCityMarkers();
      }
    }

    if (changes['selectedCity'] && !changes['selectedCity'].isFirstChange()) {
      this.selectedCity = changes['selectedCity']
        .currentValue as SelectedCityDto | null;

      if (this.selectedCity === null) {
        this.removeMarkers(this.waypointMarkers);
        this.unblockCityView();
      } else {
        this.removeMarkers(this.cityMarkers);
        this.blockCityView();
      }
    }

    if (changes['currentDayIndex']) {
      this.currentDayIndex = changes['currentDayIndex'].currentValue as number;

      if (this.selectedCity !== null) {
        this.removeMarkers(this.waypointMarkers);
        this.renderWaypointMarkers();
      }
    }

    this.changeDetector.detectChanges();
  }

  private initializeMap(): void {
    if (!this.mapElement?.nativeElement || this.mapInitializationFlag) {
      return;
    }

    this.map = new google.maps.Map(
      this.mapElement!.nativeElement,
      this.options
    );

    this.mapInitializationFlag = true;
  }

  private initializeCityClickListener() {
    this.cityClickListener = this.map!.addListener(
      'click',
      async (event: google.maps.MapMouseEvent) => {
        event.stop();
        this.drawCityOverlayAsync(event, this.geocoder);
      }
    );
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

  private renderCityMarkers(): void {
    if (this.map) {
      this.cityList.forEach((addCityDto, index) => {
        let cityMarker = this.googleComponentsFactoryService.createMarker(
          this.map!,
          { lat: addCityDto.latitude, lng: addCityDto.longitude },
          addCityDto.name,
          addCityDto,
          undefined,
          (city) => {
            console.log(
              `Marker clicked for city: ${(city as AddCityDto).name}`
            );
          },
          index + 1
        );

        this.cityMarkers.push(cityMarker);
      });
    }
  }

  private renderWaypointMarkers(): void {
    if (this.map === null) {
      return;
    }

    this.selectedCity!.selectedCity?.waypoints[this.currentDayIndex].forEach(
      (waypointDto, index) => {
        let cityMarker = this.googleComponentsFactoryService.createMarker(
          this.map!,
          { lat: waypointDto.latitude, lng: waypointDto.longitude },
          waypointDto.name,
          waypointDto,
          undefined,
          (waypoint) => {
            console.log(
              `Marker clicked for waypoint: ${
                (waypoint as AddWaypointDto).name
              }`
            );
          },
          index + 1
        );

        this.waypointMarkers.push(cityMarker);
      }
    );
  }

  private blockCityView() {
    this.destroyListener();

    this.map?.setOptions({
      restriction: {
        latLngBounds: this.selectedCity!.bounds!,
        strictBounds: false,
      },
      minZoom: 5,
    });

    this.renderWaypointMarkers();
  }

  private unblockCityView() {
    this.map?.setOptions(this.options);
    if (this.cityClickListener === null) {
      this.initializeCityClickListener();
    }

    this.renderCityMarkers();
  }

  private removeMarkers(markers: google.maps.marker.AdvancedMarkerElement[]) {
    markers.forEach((marker) => (marker.map = null));
  }

  private destroyListener() {
    if (this.cityClickListener) {
      google.maps.event.removeListener(this.cityClickListener);
      this.cityClickListener = null;
    }
  }
}
