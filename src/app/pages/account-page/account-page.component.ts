import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UserDto } from '../../interfaces/dtos/response/user-dto';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { minimumAgeValidator } from '../../shared/helpers/validators';
import { HomeCityDto } from '../../interfaces/dtos/home-city-dto';
import { LatLngBound } from '../../interfaces/dtos/lat-lang-bound';
import { Subscription } from 'rxjs';
import { UpdateUserDto } from '../../interfaces/dtos/request/update-user-dto';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;

  userDetails: UserDto | null = null;
  homeCity: HomeCityDto | null = null;

  userDetailsForm: FormGroup = new FormGroup({});

  private subscriptions: Subscription[] = [];
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.userService.getUserDetails().subscribe({
        next: (response) => {
          this.userDetails = response as UserDto;
          this.setForm();
        },
      })
    );

    this.userDetailsForm = this.formBuilder.group({
      profileName: ['', [Validators.required]],
      email: ['', []],
      homeCity: ['', [Validators.required]],
      profileDescription: ['', [Validators.maxLength(200)]],
    });

    this.userDetailsForm.get('email')?.disable();
  }

  ngAfterViewInit(): void {
    this.initializeCityAutocomplete();
  }

  private setForm() {
  // Update form with user details
  this.userDetailsForm.patchValue({
    email: this.userDetails?.email || '',
    profileName: this.userDetails?.profileName || '',
    homeCity: this.userDetails?.homeCity?.city || '',
    profileDescription: this.userDetails?.profileDescription || '',
  });
}

  onFormSubmit() {
    if (this.userDetailsForm.invalid) {
      // IMPORTANT: Show error feedback
      return;
    }

    const updatedUser: UpdateUserDto = {
      id: this.userDetails!.id,
      profileName: this.userDetailsForm.get('profileName')!.value,
      homeCity: this.homeCity,
      profileDescription: this.userDetailsForm.get('profileDescription')!.value,
    };

    this.subscriptions.push(
      this.userService.updateUser(updatedUser).subscribe({
        next: (response) => {
          console.log('User updated successfully:', response);
          this.userDetails = response as UserDto;
          this.setForm();
        },
        error: (error) => {
          console.error('Error updating user:', error);
        },
      })
    );
  }

  private initializeCityAutocomplete() {
    if (this.cityNameInput?.nativeElement === undefined) {
      console.error(
        'City Name Input is not rendered. The autocomplete cannot be initialized.'
      );
      return;
    }

    this.cityAutocomplete = new google.maps.places.Autocomplete(
      this.cityNameInput!.nativeElement,
      {
        types: ['(cities)'],
      }
    );

    this.cityAutocomplete.addListener('place_changed', () => {
      let place = this.cityAutocomplete!.getPlace();

      if (!place.place_id || !place.name) {
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      const cityName = place.name;
      this.cityNameInput!.nativeElement.value = cityName;

      // this.cityForm.get('cityName')?.setErrors(null);

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
        console.error('Bounds of city cannot be found.');
        return;
      }

      this.homeCity = {
        city: cityName,
        placeId: placeId,
        country: countryName,
        latitude: latitude,
        longitude: longitude,
        northEastBound: new LatLngBound(
          northEastBound!.lat(),
          northEastBound!.lng()
        ),
        southWestBound: new LatLngBound(
          southWestBound!.lat(),
          southWestBound!.lng()
        ),
      } as HomeCityDto;
    });
  }

  private destroyAutocomplete(
    autocomplete: google.maps.places.Autocomplete | null
  ) {
    if (autocomplete) {
      google.maps.event.clearInstanceListeners(autocomplete);
      autocomplete = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyAutocomplete(this.cityAutocomplete);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
