import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { PanelView } from '../../../helpers/panel-view.enum';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../../interfaces/dtos/add-city-dto';
import { datePickerValidator } from '../../../../shared/helpers/validators';

@Component({
  selector: 'app-city-list-panel',
  templateUrl: './city-list-panel.component.html',
  styleUrl: './city-list-panel.component.scss',
})
export class CityListPanelComponent implements OnInit, OnChanges {
  @Input() cityAddedFromMap: CityTransferDto | undefined = undefined;
  @Output() cityAddedFromPanel = new EventEmitter<{ city: CityTransferDto }>();

  public PanelView = PanelView;

  currentView: PanelView = PanelView.AddCityView; // change it
  addCityForm: FormGroup = new FormGroup({});
  cityList: AddCityDto[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.addCityForm = this.formBuilder.group(
      {
        cityName: ['', [Validators.required]],
        arrivalDate: ['', [Validators.required]],
        departureDate: ['', [Validators.required]],
      },
      { validators: [datePickerValidator] }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['cityAddedFromMap'] &&
      (changes['cityAddedFromMap'].currentValue as CityTransferDto)
    ) {
      let cityTransferDto = changes['cityAddedFromMap']
        .currentValue as CityTransferDto;

      this.setCurrentView(PanelView.AddCityView);

      this.addCityForm.get('cityName')?.setValue(cityTransferDto.name);
      this.changeDetector.detectChanges();
    }
  }

  setCurrentView(view: PanelView) {
    if (view === PanelView.AddCityView) {
      this.addCityForm.reset();
    }
    
    this.currentView = view;
    this.changeDetector.detectChanges();
  }

  onAddCitySubmit() {}
}
