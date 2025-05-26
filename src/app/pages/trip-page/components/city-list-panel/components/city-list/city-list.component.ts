import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { PanelView } from '../../../../../helpers/panel-view.enum';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { SelectedCityVisitDto } from '../../../../../../interfaces/dtos/selected-city-dto';
import { BaseCityVisitDto } from '../../../../../../interfaces/dtos/base-dtos/base-city-visit-dto';
import { UiHelper } from '../../../../../../shared/helpers/ui-helper';

@Component({
  selector: 'app-city-list',
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CityListComponent implements OnInit, OnDestroy {
  @Input() setCurrentView!: (panelView: PanelView) => void;
  @Input() openDeleteModal!: (type: 'city' | 'waypoint', data: any) => void;

  PanelView = PanelView;
  cityVisits: BaseCityVisitDto[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private tripStateService: TripStateService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getCityVisits().subscribe((cities) => {
        this.cityVisits = cities;
      })
    );
  }

  getFormattedDate(date: Date): string {
    var date = UiHelper.getSummedDate(date, 0);

    return UiHelper.getShortMonthDate(date);
  }

  onCityClick(selectedCity: BaseCityVisitDto) {
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

    let selectedCityDto = new SelectedCityVisitDto(selectedCity, cityBounds);
    this.tripStateService.updateSelectedCity(selectedCityDto);
  }

  onEditClick(entity: BaseCityVisitDto) {
    this.tripStateService.updateCityVisitToEdit(entity);
    this.setCurrentView(PanelView.CityView);
  }

  onDeleteClick(entity: BaseCityVisitDto) {
    this.openDeleteModal('city', entity);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
