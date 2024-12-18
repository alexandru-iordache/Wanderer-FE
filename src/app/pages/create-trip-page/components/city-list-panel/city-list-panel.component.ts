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
import { datePickerValidator } from '../../../../shared/helpers/validators';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';

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
    bounds: google.maps.LatLngBounds | null;
  }>();

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;

  public PanelView = PanelView;
  private autocomplete: google.maps.places.Autocomplete | null = null;
  addCityForm: FormGroup = new FormGroup({});

  currentView: PanelView = PanelView.AddCityView; // change it
  addCityDto: AddCityDto | null = null;

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
      this.initializeAutocomplete();
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
      this.addCityDto = new AddCityDto(
        cityTransferDto.name,
        cityTransferDto.country,
        cityTransferDto.latitude,
        cityTransferDto.longitude,
        null,
        0,
        cityTransferDto.northEastBound,
        cityTransferDto.southWestBound
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

      if (this.addCityDto === null) {
        // IMPORTANT: Error snackbar, unexepected error
        return;
      }

      let nights = this.cityList.reduce(
        (sumOfNights, city) => sumOfNights + city.numberOfNights,
        0
      );

      // console.log(nights);

      let tempDate = new Date(this.startDate!);
      tempDate.setDate(this.startDate!.getDate() + nights);

      // console.log(tempDate);

      this.addCityDto!.arrivalDate = tempDate;
      this.addCityDto!.numberOfNights = numberOfNights;

      this.citySubmitted.emit({ city: this.addCityDto });

      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  clickCity(addCityDto: AddCityDto) {
    console.log('City clicked: ' + addCityDto.name);
    const cityBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(
        addCityDto.southWestBound.latitude,
        addCityDto.southWestBound.longitude
      ),
      new google.maps.LatLng(
        addCityDto.northEastBound.latitude,
        addCityDto.northEastBound.longitude
      )
    );

    this.citySelected.emit({ bounds: cityBounds });
  }

  setCurrentView(view: PanelView) {
    if (this.currentView === PanelView.AddCityView) {
      this.destroyAutocomplete();
    }

    this.currentView = view;
    this.changeDetector.detectChanges();

    switch (view) {
      case PanelView.AddCityView:
        this.addCityForm.reset();
        this.initializeAutocomplete();
        break;
      case PanelView.CitiesListView:
        break;
      default:
        break;
    }
  }

  private initializeAutocomplete() {
    if (this.cityNameInput?.nativeElement === undefined) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(
      this.cityNameInput!.nativeElement,
      {
        types: ['(cities)'],
      }
    );
    this.autocomplete.addListener('place_changed', () => {
      let place = this.autocomplete!.getPlace();

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

      this.addCityDto = new AddCityDto(
        cityName,
        countryName,
        latitude,
        longitude,
        null,
        0,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng())
      );
    });
  }

  private destroyAutocomplete() {
    if (this.autocomplete) {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = null;
    }
  }
}
