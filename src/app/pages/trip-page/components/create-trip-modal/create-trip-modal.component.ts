import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ModalView } from '../../../helpers/modal-view.enum';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { City } from '../../../../interfaces/models/city';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';
import { TripStateService } from '../../services/trip-state.service';
import { BaseTripDto } from '../../../../interfaces/dtos/request/base-trip-dto';

@Component({
  selector: 'app-create-trip-modal',
  templateUrl: './create-trip-modal.component.html',
  styleUrl: './create-trip-modal.component.scss',
})
export class CreateTripModalComponent
  implements OnInit, AfterViewInit, AfterViewChecked
{
  @Output() viewChanged = new EventEmitter<{ view: ModalView }>();
  @ViewChild('startingLocationInput')
  startingLocationInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tripTitleInput')
  tripTitleInput?: ElementRef<HTMLInputElement>;
  @ViewChild('departureDate') departureDateInput?: ElementRef<HTMLInputElement>;

  public modalView = ModalView;
  private autocomplete: google.maps.places.Autocomplete | null = null;

  currentView: ModalView = ModalView.WelcomeView;
  autocompleteInitializationFlag: boolean = false;
  userHomeAddressFlag: boolean = false;
  startingCity: CityTransferDto | undefined = undefined;

  constructor(
    private googleMapsService: GoogleMapsService,
    private tripStateService: TripStateService
  ) {}

  ngOnInit(): void {
    this.currentView = ModalView.WelcomeView;
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      if (this.googleMapsService.isScriptLoaded() === false) {
        await this.googleMapsService.loadScriptAsync();
      }
    } catch (error) {
      console.error(
        '[Create-Trip-Modal] Google Maps script not loaded.',
        error
      );
    }
  }

  ngAfterViewChecked(): void {
    if (
      this.currentView === ModalView.CreateFromScrathView &&
      this.autocompleteInitializationFlag === false
    ) {
      this.initializeModalLocationAutocomplete();
    }
  }

  createTrip(): void {
    this.setCurrentView(ModalView.NoView);

    let startDateValue = new Date(
      this.departureDateInput?.nativeElement.value!
    );

    let tripTitleValue = this.tripTitleInput?.nativeElement.value!;

    this.tripStateService.updateCityToAdd(this.startingCity);
    this.tripStateService.updateStartDate(startDateValue);
    this.tripStateService.updateTrip({
      cityVisits: [],
      startDate: startDateValue,
      title: tripTitleValue,
    } as BaseTripDto);
  }

  setCurrentView(view: ModalView): void {
    this.currentView = view;
    this.viewChanged.emit({ view });
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

  private initializeModalLocationAutocomplete(): void {
    if (this.startingLocationInput?.nativeElement === undefined) {
      console.error(
        'City Name Input is not rendered. The autocomplete cannot be initialized.'
      );
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(
      this.startingLocationInput!.nativeElement,
      {
        types: ['(cities)'],
      }
    );

    this.autocomplete.addListener('place_changed', () => {
      let place = this.autocomplete!.getPlace();

      if (!place.place_id || !place.name) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      const cityName = place.name;
      this.startingLocationInput!.nativeElement.value = cityName;

      // IMPORTANT: Show no result feedback, country filtering etc
      const placeId = place.place_id;
      const countryName =
        place.address_components
          .filter((x) => x.types.includes('country'))
          .at(0)?.long_name ?? '';

      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      var northEastBound = place.geometry?.viewport?.getNorthEast();
      var southWestBound = place.geometry?.viewport?.getSouthWest();

      if (northEastBound === undefined || southWestBound === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      this.startingCity = new CityTransferDto(
        cityName,
        placeId!,
        countryName,
        latitude,
        longitude,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng())
      );
    });
    this.autocompleteInitializationFlag = true;
  }
}
