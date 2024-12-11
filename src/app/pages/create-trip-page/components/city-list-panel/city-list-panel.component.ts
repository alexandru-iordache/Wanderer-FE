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
  @Output() citySubmitted = new EventEmitter<{ city: AddCityDto }>();

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
    this.addCityForm = this.formBuilder.group(
      {
        cityName: ['', [Validators.required]],
        arrivalDate: ['', [Validators.required]],
        departureDate: ['', [Validators.required]],
      },
      { validators: [datePickerValidator] }
    );

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
        cityTransferDto.longitude
      );

      this.changeDetector.detectChanges();
    }
  }

  onAddCitySubmit() {
    if (this.addCityForm.valid) {
      const arrivalDate = this.addCityForm.get('arrivalDate')?.value;
      const departureDate = this.addCityForm.get('departureDate')?.value;

      if (this.addCityDto === null) {
        // IMPORTANT: Error snackbar, unexepected error
        return;
      }

      this.addCityDto!.startDate = arrivalDate;
      this.addCityDto!.endDate = departureDate;

      this.citySubmitted.emit({ city: this.addCityDto });
      
      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  setCurrentView(view: PanelView) {
    this.currentView = view;
    this.changeDetector.detectChanges();

    switch (view) {
      case PanelView.AddCityView:
        this.addCityForm.reset();
        this.initializeAutocomplete();
        break;
      case PanelView.CitiesListView:
        this.destroyAutocomplete();
        break;
      default:
        this.destroyAutocomplete();
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

      this.cityNameInput!.nativeElement.value = place.formatted_address ?? '';
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

      this.addCityDto = new AddCityDto(
        shortName,
        countryName,
        latitude,
        longitude
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
