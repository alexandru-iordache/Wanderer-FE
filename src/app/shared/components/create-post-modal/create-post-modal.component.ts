import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { Uuid } from '../../helpers/uuid';
import { TripDto } from '../../../interfaces/dtos/request/base-trip-dto';
import { PostCityDto } from '../../../interfaces/dtos/post-location-dto';
import { ImageInfoDto } from '../../../interfaces/dtos/image-info-dto';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrl: './create-post-modal.component.scss',
})
export class CreatePostModalComponent implements AfterViewInit, OnInit {
  @Input() trip: TripDto | null = null;
  
  @Output() confirm = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();
  
  @ViewChild('descriptionTextarea')
  descriptionTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('titleTextarea') titleTextarea!: ElementRef<HTMLInputElement>;
  
  readonly MAX_TITLE_LENGTH = 50;
  titleCharCount = 0;
  isAddImageFlowOpened: boolean = false;
    cities: PostCityDto[] = [];
  postTitle: string = '';
  postDescription: string = '';
  uploadedImages: ImageInfoDto[] = [];

  ngOnInit(): void {
    if (this.trip === null) 
      {
        console.error('Trip data is required to initialize the post modal.');
        return;
      }

      this.cities = this.trip.cityVisits.map(cityVisit => ({
        id: cityVisit.id as Uuid,
        name: cityVisit.city,
        placeId: cityVisit.placeId,
        waypoints: cityVisit.dayVisits.flatMap(dayVisit =>
          dayVisit.waypointVisits.map(waypointVisit => ({
            id: waypointVisit.id as Uuid,
              name: waypointVisit.name,
              placeId: waypointVisit.placeId,
              type: waypointVisit.type
            })))
      }));
    }
  
  
  ngAfterViewInit(): void {
    this.adjustTextareaHeight();
  }  addImage() {
    this.isAddImageFlowOpened = true;
  }

  onImageSelectionResponse(response: {imageInfo: ImageInfoDto | null, imageUploaded: boolean}): void {
    if (response.imageUploaded && response.imageInfo) {
      this.uploadedImages.push(response.imageInfo);
    }
    
    this.isAddImageFlowOpened = false;
  }

  onImageRemoved(imageInfo: ImageInfoDto): void {
    this.uploadedImages = this.uploadedImages.filter(
      (img) => img.imageUrl !== imageInfo.imageUrl
    );
  }

  onTextareaInput(): void {
    this.adjustTextareaHeight();
    this.postDescription = this.descriptionTextarea.nativeElement.value;
  }

  onTitleInput(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > this.MAX_TITLE_LENGTH) {
      input.value = input.value.slice(0, this.MAX_TITLE_LENGTH);
    }
    this.titleCharCount = input.value.length;
    this.postTitle = input.value;
  }

  private adjustTextareaHeight(): void {
    const textarea = this.descriptionTextarea?.nativeElement;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
