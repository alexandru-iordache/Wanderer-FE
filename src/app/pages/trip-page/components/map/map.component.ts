import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { GoogleComponentsFactoryService } from '../../../../services/google-componets-factory.service';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';
import { SelectedCityVisitDto } from '../../../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../../../interfaces/dtos/add-waypoint-dto';
import { TripStateService } from '../../services/trip-state.service';
import { skip, Subscription } from 'rxjs';
import { WaypointType } from '../../../helpers/waypoint-type.enum';
import {
  ATTRACTIONS_WAYPOINT_TYPES,
  FOOD_WAYPOINT_TYPES,
  RECREATIONAL_WAYPOINT_TYPES,
} from '../../../../shared/helpers/preferred-waypoint-types';
import { BaseCityVisitDto } from '../../../../interfaces/dtos/base-dtos/base-city-visit-dto';
import { BaseWaypointVisitDto } from '../../../../interfaces/dtos/base-dtos/base-waypoint-visit-dto';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() options: google.maps.MapOptions = {};
  @ViewChild('map') mapElement?: ElementRef<HTMLDivElement>;

  map: google.maps.Map | null = null;

  private currentDayIndex: number = 0;
  private cityVisits: BaseCityVisitDto[] = [];
  private selectedCity: SelectedCityVisitDto | null = null;

  private mapInitializationFlag: boolean = false;
  private cityOverlay: any | undefined = undefined;
  private waypointOverlay: any | undefined = undefined;
  private cityMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private waypointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private geocoder: google.maps.Geocoder;

  private cityClickListener: google.maps.MapsEventListener | null = null;
  private waypointClickListener: google.maps.MapsEventListener | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private googleMapsService: GoogleMapsService,
    private googleComponentsFactoryService: GoogleComponentsFactoryService,
    private tripStateService: TripStateService
  ) {
    this.geocoder = new google.maps.Geocoder();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getCityVisits().subscribe((cities) => {
        this.handleCitiesChange(cities);
      }),
      this.tripStateService
        .getSelectedCityVisit()
        .pipe(skip(1))
        .subscribe((selectedCity) => {
          this.handleSelectedCityChange(selectedCity);
        }),
      this.tripStateService.getCurrentDayIndex().subscribe((index) => {
        this.handleCurrentDayIndexChange(index);
      })
    );
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

  private handleCurrentDayIndexChange(index: number) {
    this.currentDayIndex = index;

    if (this.selectedCity !== null) {
      this.removeMarkers(this.waypointMarkers);
      this.renderWaypointMarkers();
    }
  }

  private handleCitiesChange(cityVisits: BaseCityVisitDto[]) {
    this.cityVisits = cityVisits;

    if (this.selectedCity !== null) {
      this.removeMarkers(this.waypointMarkers);
      this.renderWaypointMarkers();
    } else {
      this.removeMarkers(this.cityMarkers);
      this.renderCityMarkers();
    }
  }

  private handleSelectedCityChange(selectedCity: SelectedCityVisitDto | null) {
    this.selectedCity = selectedCity;

    if (this.selectedCity === null) {
      this.removeMarkers(this.waypointMarkers);
      this.unblockCityView();
    } else {
      this.removeMarkers(this.cityMarkers);
      this.blockCityView();
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

  private initializeWaypointClickListener() {
    this.waypointClickListener = this.map!.addListener(
      'click',
      async (event: google.maps.MapMouseEvent) => {
        event.stop();
        this.drawWaypointOverlayAsync(event, this.geocoder);
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

      const placeId = city.place_id;
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
        placeId,
        countryName!,
        latitude,
        longitude,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng())
      );

      this.cityOverlay = this.googleComponentsFactoryService.createCityOverlay(
        { lat: latitude, lng: longitude },
        cityObject,
        (city: CityTransferDto | undefined) => {
          this.tripStateService.updateCityToAdd(city);
        }
      );

      this.cityOverlay.setMap(this.map);
    });
  }

  private drawWaypointOverlayAsync(
    event: google.maps.MapMouseEvent,
    geocoder: google.maps.Geocoder
  ) {
    if (this.selectedCity === null) {
      console.error('No city is selected. The overlay cannot be drawn.');
      return;
    }

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

      const place = results.find((result) =>
        result.types.includes('establishment')
      );
      console.log(place);

      if (place === undefined) {
        // IMPORTANT: Add error snackbar or something
        console.log('No waypoint found in the results[] response.');
        return;
      }

      if (this.waypointOverlay) {
        this.waypointOverlay.setMap(null);
      }

      const waypointType = this.getWaypointType(place.types!);
      if (waypointType === WaypointType.Unkwnown) {
        console.log("Type is not ok.");
        return;
      }

      // IMPORTANT: Show no result feedback, country filtering etc
      const placeId = place.place_id;
      const waypointName = place.address_components
        .filter((x) => x.types.includes('locality'))
        .at(0)?.long_name;
      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      const waypointToAdd = new AddWaypointDto(
        waypointName!,
        waypointType.toString(),
        placeId,
        latitude,
        longitude,
        '',
        '',
        0
      );

      this.waypointOverlay = this.googleComponentsFactoryService.createWaypointOverlay(
        { lat: latitude, lng: longitude },
        waypointToAdd,
        (waypoint: AddWaypointDto | undefined) => {
          this.tripStateService.updateWaypointToAdd(waypoint);
        }
      );

      this.waypointOverlay.setMap(this.map);
    });
  }

  private renderCityMarkers(): void {
    if (this.map) {
      this.cityVisits.forEach((cityVisit, index) => {
        let cityMarker = this.googleComponentsFactoryService.createMarker(
          this.map!,
          { lat: cityVisit.latitude, lng: cityVisit.longitude },
          cityVisit.city,
          cityVisit,
          undefined,
          (cityVisit) => {
            console.log(
              `Marker clicked for city: ${(cityVisit as BaseCityVisitDto).city}`
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

    this.selectedCity!.cityVisit?.dayVisits[this.currentDayIndex].waypointVisits.forEach(
      (waypointVisit, index) => {
        let cityMarker = this.googleComponentsFactoryService.createMarker(
          this.map!,
          { lat: waypointVisit.latitude, lng: waypointVisit.longitude },
          waypointVisit.name,
          waypointVisit,
          undefined,
          (waypoint) => {
            console.log(
              `Marker clicked for waypoint: ${
                (waypoint as BaseWaypointVisitDto).name
              }`
            );
          },
          index + 1
        );

        this.waypointMarkers.push(cityMarker);
      }
    );
  }

  private getWaypointType(types: string[]): WaypointType {
    const foodMatch = types.find((type) =>
      FOOD_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (foodMatch) {
      return WaypointType.Food;
    }

    const recreationalMatch = types.find((type) =>
      RECREATIONAL_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (recreationalMatch) {
      return WaypointType.Recreational;
    }

    const attractionMatch = types.find((type) =>
      ATTRACTIONS_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (attractionMatch) {
      return WaypointType.Attraction;
    }

    return WaypointType.Unkwnown;
  }

  private blockCityView() {
    this.destroyListener(this.cityClickListener);
    this.map?.setOptions({
      restriction: {
        latLngBounds: this.selectedCity!.bounds!,
        strictBounds: false,
      },
      minZoom: 5,
    });

    this.initializeWaypointClickListener();

    this.renderWaypointMarkers();
  }

  private unblockCityView() {
    this.destroyListener(this.waypointClickListener);
    this.map?.setOptions(this.options);

    this.initializeCityClickListener();

    this.renderCityMarkers();
  }

  private removeMarkers(markers: google.maps.marker.AdvancedMarkerElement[]) {
    markers.forEach((marker) => (marker.map = null));
  }

  private destroyListener(listener: google.maps.MapsEventListener | null) {
    if (listener === null) {
      return;
    }

    google.maps.event.removeListener(listener);
    listener = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
    this.destroyListener(this.cityClickListener);
    this.destroyListener(this.waypointClickListener);
  }
}
