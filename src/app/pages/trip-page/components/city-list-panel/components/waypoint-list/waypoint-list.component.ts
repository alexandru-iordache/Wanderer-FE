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
import { BaseCityVisitDto } from '../../../../../../interfaces/dtos/request/base-city-visit-dto';
import { BaseWaypointVisitDto } from '../../../../../../interfaces/dtos/request/base-waypoint-visit-dto';
import { UiHelper } from '../../../../../../shared/helpers/ui-helper';

@Component({
  selector: 'app-waypoint-list',
  templateUrl: './waypoint-list.component.html',
  styleUrl: './waypoint-list.component.scss',
})
export class WaypointListComponent implements OnInit, OnDestroy {
  @Input() setCurrentView!: (panelView: PanelView) => void;
  @Input() openDeleteModal!: (type: 'city' | 'waypoint', data: any) => void;

  currentDayIndex: number = 0;
  selectedCityVisit: BaseCityVisitDto | null = null;
  PanelView = PanelView;

  private subscriptions: Subscription[] = [];

  constructor(
    private tripStateService: TripStateService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getCurrentDayIndex().subscribe((index) => {
        this.currentDayIndex = index;
      }),
      this.tripStateService.getSelectedCityVisit().subscribe((value) => {
        this.selectedCityVisit = value !== null ? value.cityVisit : null;
        this.changeDetector.detectChanges();
      })
    );
  }

  navigateToDay(dayIndex: number): void {
    this.tripStateService.updateCurrentDayIndex(dayIndex);
    this.changeDetector.detectChanges();
  }

  getDateForDay(startDate: Date, dayIndex: number): string {
   const currentDayDate = UiHelper.getSummedDate(startDate, dayIndex);

    return UiHelper.getLongMonthDate(currentDayDate);
  }

  onEditClick(entity: BaseWaypointVisitDto) {
    this.tripStateService.updateWaypointVisitToEdit(entity);
    this.setCurrentView(PanelView.WaypointView);
  }

  onDeleteClick(entity: BaseWaypointVisitDto) {
    this.openDeleteModal('waypoint', entity);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
