import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { PanelView } from '../../../helpers/panel-view.enum';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../../interfaces/dtos/add-city-dto';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';
import { SelectedCityDto } from '../../../../interfaces/dtos/selected-city-dto';

@Component({
  selector: 'app-city-list-panel',
  templateUrl: './city-list-panel.component.html',
  styleUrl: './city-list-panel.component.scss',
})
export class CityListPanelComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() cityToAdd: CityTransferDto | undefined = undefined;
  @Input() cityList: AddCityDto[] = [];
  @Input() startDate: Date | null = null;
  @Output() citySubmitted = new EventEmitter<{ city: AddCityDto }>();
  @Output() citySelected = new EventEmitter<{
    selectedCityDto: SelectedCityDto;
  }>();

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('waypointName') waypointNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;
  addCityForm: FormGroup = new FormGroup({});
  addWaypointForm: FormGroup = new FormGroup({});

  currentView: PanelView = PanelView.CitiesListView; // change it
  selectedCity: AddCityDto | null = null;
  currentDayIndex: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private googleMapsService: GoogleMapsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.addCityForm = this.formBuilder.group({
      cityName: ['', [Validators.required]],
      numberOfNights: ['', [Validators.required]],
    });

    this.addWaypointForm = this.formBuilder.group({
      waypointName: ['', [Validators.required]],
      numberOfHours: ['', [Validators.required]],
    });

    try {
      if (this.googleMapsService.isScriptLoaded() === false) {
        await this.googleMapsService.loadScriptAsync();
      }
    } catch (error) {
      console.error('[City-List-Panel] Google Maps script not loaded.', error);
    }
  }

  ngAfterViewInit(): void {
    if (this.currentView === PanelView.AddCityView) {
      this.addCityForm.reset();
      this.initializeCityAutocomplete();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['cityToAdd'] &&
      (changes['cityToAdd'].currentValue as CityTransferDto)
    ) {
      let cityTransferDto = changes['cityToAdd']
        .currentValue as CityTransferDto;

      this.setCurrentView(PanelView.AddCityView);

      this.addCityForm.get('cityName')?.setValue(cityTransferDto.name);
      this.selectedCity = new AddCityDto(
        cityTransferDto.name,
        cityTransferDto.country,
        cityTransferDto.latitude,
        cityTransferDto.longitude,
        null,
        0,
        cityTransferDto.northEastBound,
        cityTransferDto.southWestBound,
        []
      );

      this.changeDetector.detectChanges();
    }

    if (changes['startDate'] && (changes['startDate'].currentValue as Date)) {
      this.startDate = new Date(changes['startDate'].currentValue);
    }
  }

  onAddCitySubmit() {
    if (this.addCityForm.valid) {
      const numberOfNights = this.addCityForm.get('numberOfNights')?.value;

      if (this.selectedCity === null) {
        // IMPORTANT: Error snackbar, unexepected error
        return;
      }

      let nights = this.cityList.reduce(
        (sumOfNights, city) => sumOfNights + city.numberOfNights,
        0
      );

      let tempDate = new Date(this.startDate!);
      tempDate.setDate(this.startDate!.getDate() + nights);

      this.selectedCity!.arrivalDate = tempDate;
      this.selectedCity!.setNumberOfNights(numberOfNights);

      this.citySubmitted.emit({ city: this.selectedCity });

      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  onAddWaypointSubmit() {
    if (this.addWaypointForm.valid) {
      const numberOfHours = this.addWaypointForm.get('numberOfHours')?.value;

      if (this.selectedCity === null) {
        // IMPORTANT: Error snackbar, unexepected error
        return;
      }

      let nights = this.cityList.reduce(
        (sumOfNights, city) => sumOfNights + city.numberOfNights,
        0
      );

      let tempDate = new Date(this.startDate!);
      tempDate.setDate(this.startDate!.getDate() + nights);

      this.selectedCity!.arrivalDate = tempDate;
      this.selectedCity!.setNumberOfNights(numberOfHours);

      this.citySubmitted.emit({ city: this.selectedCity });

      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  clickCity(selectedCity: AddCityDto) {
    console.log('City clicked: ' + selectedCity.name);
    const cityBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(
        selectedCity.southWestBound.latitude,
        selectedCity.southWestBound.longitude
      ),
      new google.maps.LatLng(
        selectedCity.northEastBound.latitude,
        selectedCity.northEastBound.longitude
      )
    );

    this.selectedCity = selectedCity;
    this.setCurrentView(PanelView.WaypointsListView);

    this.citySelected.emit({
      selectedCityDto: new SelectedCityDto(selectedCity, cityBounds),
    });
  }

  setCurrentView(view: PanelView) {
    if (this.currentView !== PanelView.AddCityView) {
      this.destroyAutocomplete(this.cityAutocomplete);
    }

    if (this.currentView !== PanelView.AddWaypointView) {
      this.destroyAutocomplete(this.waypointAutocomplete);
    }

    this.currentView = view;
    this.changeDetector.detectChanges();

    switch (view) {
      case PanelView.AddCityView:
        this.addCityForm.reset();
        this.initializeCityAutocomplete();
        break;
      case PanelView.CitiesListView:
        break;
      case PanelView.AddWaypointView:
        this.addWaypointForm.reset();
        this.initializeWaypointAutocomplete();
        break;
      case PanelView.WaypointsListView:
        break;
      default:
        break;
    }
  }

  navigateToDay(dayIndex: number): void {
    this.currentDayIndex = dayIndex;
  }

  getDateForDay(startDate: Date, dayIndex: number): string {
    const result = new Date(startDate);
    result.setDate(startDate.getDate() + dayIndex);
    return result.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
    });
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

      this.cityNameInput!.nativeElement.value = place.name ?? '';
      if (place === undefined) {
        // IMPORTANT: Modify drop down to show no result
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      // IMPORTANT: Show no result feedback, country filtering etc
      const cityName =
        place.address_components
          .filter((x) => x.types.includes('locality'))
          .at(0)?.long_name ?? '';
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

      this.selectedCity = new AddCityDto(
        cityName,
        countryName,
        latitude,
        longitude,
        null,
        0,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng()),
        []
      );
    });
  }

  private initializeWaypointAutocomplete() {
    if (this.waypointNameInput?.nativeElement === undefined) {
      console.error(
        'Waypoint Name Input is not rendered. The autocomplete cannot be initialized.'
      );
      return;
    }

    if (this.selectedCity === null) {
      console.error(
        'No city is selected. The autocomplete cannot be initialized.'
      );
      return;
    }

    this.waypointAutocomplete = new google.maps.places.Autocomplete(
      this.waypointNameInput!.nativeElement,
      {
        types: ['establishment'],
        fields: ['name', 'latitude', 'longitude', 'types', 'place_id'],
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(this.selectedCity.southWestBound.latitude, this.selectedCity.southWestBound.longitude),
          new google.maps.LatLng(this.selectedCity.northEastBound.latitude, this.selectedCity.northEastBound.longitude) 
        ),
        strictBounds: true
      }
    );

    this.waypointAutocomplete.addListener('place_changed', () => {
      let place = this.waypointAutocomplete!.getPlace();

      this.waypointNameInput!.nativeElement.value = place.name ?? '';
      if (place === undefined) {
        // IMPORTANT: Modify drop down to show no result
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      // IMPORTANT: Show no result feedback, country filtering etc
      const cityName =
        place.address_components
          .filter((x) => x.types.includes('locality'))
          .at(0)?.long_name ?? '';
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

      // this.selectedCity = new AddCityDto(
      //   cityName,
      //   countryName,
      //   latitude,
      //   longitude,
      //   null,
      //   0,
      //   new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
      //   new LatLngBound(southWestBound!.lat(), southWestBound!.lng()),
      //   []
      // );
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
}
