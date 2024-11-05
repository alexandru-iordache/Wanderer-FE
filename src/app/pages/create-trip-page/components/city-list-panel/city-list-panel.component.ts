import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { City } from '../../../../interfaces/city';

@Component({
  selector: 'app-city-list-panel',
  templateUrl: './city-list-panel.component.html',
  styleUrl: './city-list-panel.component.scss',
})
export class CityListPanelComponent implements OnChanges{
  @Input() cityAddedFromMap: City | undefined = undefined;
  @Output() cityAddedFromPanel = new EventEmitter<{ city: City }>();

  cityList: City[] = [new City('Barcelona', 'Spain', 40, 50)];

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log("coco");
    if (changes['onCityAddedFromMap'] && changes['onCityAddedFromMap'].currentValue as City){
      console.log("coco2");
      this.cityList.push(changes['onCityAddedFromMap'].currentValue);
      this.changeDetector.detectChanges();
    }
  }

  onCityAddedFromMap(cityData: { city: City }) {
    this.cityList.push(cityData.city);
    console.log(
      'Added to list:',
      cityData.city.name +
        ', ' +
        cityData.city.country +
        ', ' +
        cityData.city.latitude +
        ', ' +
        cityData.city.longitude
    );
    this.changeDetector.detectChanges();
  }
}
