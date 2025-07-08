import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Uuid } from '../../helpers/uuid';
import { TripDto } from '../../../interfaces/dtos/base-dtos/base-trip-dto';
import { PostCityDto } from '../../../interfaces/dtos/post-location-dto';
import { BaseImageInfoDto } from '../../../interfaces/dtos/base-dtos/base-image-info-dto';
import { AddPostDto } from '../../../interfaces/dtos/base-dtos/base-post-dto';
import { PostService } from '../../../services/post.service';
import { ModalService } from '../../../services/modal.service';
import { Subscription } from 'rxjs';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrl: './create-post-modal.component.scss',
})
export class CreatePostModalComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @Input() tripId: Uuid | null = null;

  @Output() confirm = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();

  @ViewChild('descriptionTextarea')
  descriptionTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('titleTextarea') titleTextarea!: ElementRef<HTMLInputElement>;

  readonly MAX_TITLE_LENGTH = 50;

  trip: TripDto | null = null;
  getTripSubscription: Subscription | null = null;
  titleCharCount = 0;
  isAddImageFlowOpened: boolean = false;
  cities: PostCityDto[] = [];
  postTitle: string = '';
  postDescription: string = '';
  uploadedImages: BaseImageInfoDto[] = [];

  constructor(
    private postService: PostService,
    private tripService: TripService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    if (this.tripId === null) {
      console.error('Trip data is required to initialize the post modal.');
      return;
    }

    this.getTripSubscription = this.tripService
      .getTripById(this.tripId)
      .subscribe({
        next: (response) => {
          this.trip = response;
          this.cities = this.trip.cityVisits.map((cityVisit) => ({
            id: cityVisit.city as Uuid,
            name: cityVisit.city,
            placeId: cityVisit.placeId,
            waypoints: cityVisit.dayVisits.flatMap((dayVisit) =>
              dayVisit.waypointVisits.map((waypointVisit) => ({
                id: waypointVisit.id as Uuid,
                name: waypointVisit.name,
                placeId: waypointVisit.placeId,
                type: waypointVisit.type,
              }))
            ),
          }));
        },
        error: (error) => {
          console.error('Error fetching trip data:', error);
          this.modalService.snackbar(
            'Failed to load trip data. Please try again.',
            10000,
            false
          );
        },
      });
  }

  ngAfterViewInit(): void {
    this.adjustTextareaHeight();
  }
  addImage() {
    this.isAddImageFlowOpened = true;
  }

  onImageSelectionResponse(response: {
    imageInfo: BaseImageInfoDto | null;
    imageUploaded: boolean;
  }): void {
    if (response.imageUploaded && response.imageInfo) {
      this.uploadedImages.push(response.imageInfo);
    }

    this.isAddImageFlowOpened = false;
  }

  onImageRemoved(imageInfo: BaseImageInfoDto): void {
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

  onCreatePost(): void {
    if (!this.postTitle.trim() || !this.postDescription.trim()) {
      console.warn('Post title and description cannot be empty.');
      return;
    }

    const postData = {
      title: this.postTitle,
      description: this.postDescription,
      images: this.uploadedImages,
      tripId: this.trip?.id,
    } as AddPostDto;

    this.postService.createPost(postData).subscribe({
      next: (post) => {
        this.modalService.snackbar('Post created successfully!', 5000, true);
        this.confirm.emit();
      },
      error: (error) => {
        console.error('Error creating post:', error);
        this.modalService.snackbar(
          'Failed to create post. Please try again.',
          10000,
          false
        );
      },
    });
  }

  private adjustTextareaHeight(): void {
    const textarea = this.descriptionTextarea?.nativeElement;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  ngOnDestroy(): void {
    if (this.getTripSubscription) {
      this.getTripSubscription.unsubscribe();
    }
  }
}
