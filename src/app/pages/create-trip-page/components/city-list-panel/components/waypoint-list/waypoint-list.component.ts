import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { PanelView } from '../../../../../helpers/panel-view.enum';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { AddCityDto } from '../../../../../../interfaces/dtos/add-city-dto';
import { AddWaypointDto } from '../../../../../../interfaces/dtos/add-waypoint-dto';

@Component({
  selector: 'app-waypoint-list',
  templateUrl: './waypoint-list.component.html',
  styleUrl: './waypoint-list.component.scss',
})
export class WaypointListComponent implements OnInit, OnDestroy {
  @Input() setCurrentView!: (panelView: PanelView) => void;
  @Input() openDeleteModal!: (type: 'city' | 'waypoint', data: any) => void;

  currentDayIndex: number = 0;
  selectedCity: AddCityDto | null = null;
  PanelView = PanelView;

  private subscriptions: Subscription[] = [];

  constructor(private tripStateService: TripStateService, private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getCurrentDayIndex().subscribe((index) => {
        this.currentDayIndex = index;
      }),
      this.tripStateService.getSelectedCity().subscribe((selectedCityDto) => {
        this.selectedCity =
          selectedCityDto !== null ? selectedCityDto.selectedCity : null;
          this.changeDetector.detectChanges();
      })
    );
  }

  navigateToDay(dayIndex: number): void {
    this.tripStateService.updateCurrentDayIndex(dayIndex);
    this.changeDetector.detectChanges();
  }

  getDateForDay(startDate: Date, dayIndex: number): string {
    const result = new Date(startDate);
    result.setDate(startDate.getDate() + dayIndex);

    return result.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
    });
  }

  onEditClick(entity: AddWaypointDto) {
    this.tripStateService.updateWaypointToEdit(entity);
    this.setCurrentView(PanelView.WaypointView);
  }

  onDeleteClick(entity: AddWaypointDto) {
    this.openDeleteModal('waypoint', entity);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
