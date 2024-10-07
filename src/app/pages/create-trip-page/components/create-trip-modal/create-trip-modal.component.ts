import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ModalView } from '../../../helpers/modal-view.enum';
import { GoogleMapsService } from '../../../../services/google-maps.service';

@Component({
  selector: 'app-create-trip-modal',
  templateUrl: './create-trip-modal.component.html',
  styleUrl: './create-trip-modal.component.scss'
})
export class CreateTripModalComponent implements OnInit, AfterViewInit {
  @Output() viewChanged = new EventEmitter<{ view: ModalView }>();
  @ViewChild('startingLocationInput') startingLocationInput?: ElementRef<HTMLInputElement>;
  @ViewChild('departureDate') departureDateInput?: ElementRef<HTMLInputElement>;

  public modalView = ModalView;

  currentStep: ModalView = ModalView.WelcomeView;
  autocompleteIntializationFlag: boolean = false;
  userHomeAddressFlag: boolean = false;

  constructor(private googleMapsService: GoogleMapsService) {
  }

  ngOnInit(): void {
    this.currentStep = ModalView.WelcomeView;
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      if (await this.googleMapsService.isScriptLoaded() === true) {
        this.initializeModalLocationAutocomplete();
      } else {
        this.googleMapsService.loadScript();
      }
    } catch (error) {
      console.error('Google Maps script not loaded.', error);
    }
  }

  

  createTrip(): void {
    console.log("hello");
    this.currentStep = ModalView.NoView;
  }

  setCurrentView(view: ModalView): void {
    this.currentStep = view;
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
    if (this.currentStep === ModalView.CreateFromScrathView && this.startingLocationInput && !this.autocompleteIntializationFlag) {
      const googleAutocomplete = new google.maps.places.Autocomplete(this.startingLocationInput!.nativeElement);
      googleAutocomplete.addListener('place_changed', () => {
        console.log("here");
        let place = googleAutocomplete.getPlace();
        this.startingLocationInput!.nativeElement.value = place.formatted_address ?? "";
      })
      this.autocompleteIntializationFlag = true;
    } else if (this.currentStep !== ModalView.CreateFromScrathView) {
      this.autocompleteIntializationFlag = false;
    }
  }

}
