import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AddCityDto } from '../../../../../../interfaces/dtos/add-city-dto';
import { PanelView } from '../../../../../helpers/panel-view.enum';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { SelectedCityDto } from '../../../../../../interfaces/dtos/selected-city-dto';

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
  cities: AddCityDto[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private tripStateService: TripStateService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getCities().subscribe((cities) => {
        this.cities = cities;
      })
    );
  }

  onCityClick(selectedCity: AddCityDto) {
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

    let selectedCityDto = new SelectedCityDto(selectedCity, cityBounds);
    this.tripStateService.updateSelectedCity(selectedCityDto);
  }

  onEditClick(entity: AddCityDto) {
    this.tripStateService.updateCityToEdit(entity);
    this.setCurrentView(PanelView.CityView);
  }

  onDeleteClick(entity: AddCityDto) {
    this.openDeleteModal('city', entity);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
