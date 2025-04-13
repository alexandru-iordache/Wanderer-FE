import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { PanelView } from '../../../helpers/panel-view.enum';
import { FormGroup } from '@angular/forms';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { SelectedCityVisitDto } from '../../../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../../../interfaces/dtos/add-waypoint-dto';
import { WaypointTransferDto } from '../../../../interfaces/dtos/waypoint-transfer-dto';
import { TripStateService } from '../../services/trip-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
})
export class PanelComponent
  implements OnInit, OnChanges
{
  @Input() openDeleteModal!: (type: 'city' | 'waypoint', data: any) => void;

  PanelView = PanelView;

  waypointForm: FormGroup = new FormGroup({}); // remove when implementing the add from map

  currentView: PanelView = PanelView.CitiesListView;
  waypointInProcess: AddWaypointDto | null = null;
  isEditFlow: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private googleMapsService: GoogleMapsService,
    private tripStateService: TripStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.push(
      this.tripStateService.getSelectedCityVisit().subscribe((selectedCity) => {
        this.handleCitySelected(selectedCity);
      }),
      this.tripStateService.getCityToAdd().subscribe((cityToAdd) => {
        if (cityToAdd === undefined) {
          return;
        }
        this.setCurrentView(PanelView.CityView);
      })
    );

    try {
      if (this.googleMapsService.isScriptLoaded() === false) {
        await this.googleMapsService.loadScriptAsync();
      }
    } catch (error) {
      console.error('[panel] Google Maps script not loaded.', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['waypointToAdd'] &&
      (changes['waypointToAdd'].currentValue as WaypointTransferDto)
    ) {
      let waypointTransferDto = changes['waypointToAdd']
        .currentValue as WaypointTransferDto;

      this.setCurrentView(PanelView.WaypointView);

      this.waypointForm.get('waypointName')?.setValue(waypointTransferDto.name);
      this.waypointInProcess = new AddWaypointDto(
        waypointTransferDto.name,
        waypointTransferDto.type,
        waypointTransferDto.placeId,
        waypointTransferDto.latitude,
        waypointTransferDto.longitude,
        '',
        '',
        0
      );
    }

    this.changeDetector.detectChanges();
  }

  handleCitySelected(selectedCity: SelectedCityVisitDto | null) {
    if (selectedCity === null) {
      this.setCurrentView(PanelView.CitiesListView)
      return;
    }

    this.setCurrentView(PanelView.WaypointsListView);
  }

  onDiscardClick(view: PanelView, type: 'city' | 'waypoint') {
    if (this.isEditFlow) {
      this.isEditFlow = false;

      if (type === 'city') {
        this.tripStateService.updateCityToEdit(undefined);
      } else {
        this.waypointForm.get('waypointName')?.enable();
      }
    } else {
      this.tripStateService.updateCityToAdd(undefined);
    }

    this.setCurrentView(view);
  }

  setCurrentView(view: PanelView) {
    this.currentView = view;
    this.changeDetector.detectChanges();
  }

  preventEnterSubmit(event: Event) {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement.tagName.toLowerCase() === 'button') {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.focusNextElement(keyboardEvent);
  }

  focusNextElement(event: KeyboardEvent) {
    const form = event.target as HTMLElement;

    const focusableElements = Array.from(
      form
        .closest('form')
        ?.querySelectorAll(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
    ) as HTMLElement[];

    const index = focusableElements.indexOf(event.target as HTMLElement);
    if (index > -1 && index < focusableElements.length - 1) {
      focusableElements[index + 1].focus();
    }
  }
}
