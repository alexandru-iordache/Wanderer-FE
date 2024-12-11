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
import { City } from '../../../../interfaces/city';

@Component({
  selector: 'app-create-trip-modal',
  templateUrl: './create-trip-modal.component.html',
  styleUrl: './create-trip-modal.component.scss',
})
export class CreateTripModalComponent
  implements OnInit, AfterViewInit, AfterViewChecked
{
  @Output() viewChanged = new EventEmitter<{ view: ModalView }>();
  @Output() cityAdded = new EventEmitter<{ city: City }>();
  @ViewChild('startingLocationInput')
  startingLocationInput?: ElementRef<HTMLInputElement>;
  @ViewChild('departureDate') departureDateInput?: ElementRef<HTMLInputElement>;

  public modalView = ModalView;
  private autocomplete: google.maps.places.Autocomplete | null = null;

  currentView: ModalView = ModalView.WelcomeView;
  autocompleteInitializationFlag: boolean = false;
  userHomeAddressFlag: boolean = false;
  startingCity: City | undefined = undefined;

  constructor(private googleMapsService: GoogleMapsService) {}

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
    this.cityAdded.emit({ city: this.startingCity! });
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

      this.startingLocationInput!.nativeElement.value =
        place.formatted_address ?? '';
      if (place === undefined) {
        // IMPORTANT: Modify drop down to show no result
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      // IMPORTANT: Show no result feedback, country filtering etc
      const shortName =
        place.address_components
          .filter((x) => x.types.includes('locality'))
          .at(0)?.short_name ?? '';
      const countryName =
        place.address_components
          .filter((x) => x.types.includes('country'))
          .at(0)?.long_name ?? '';
      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      this.startingCity = new City(
        shortName,
        countryName,
        latitude,
        longitude,
        new Date(),
        new Date()
      );
    });
    this.autocompleteInitializationFlag = true;
  }
}
