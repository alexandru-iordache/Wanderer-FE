import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  PostCityDto,
  PostWaypointDto,
} from '../../../../../interfaces/dtos/post-location-dto';
import { ImageInfoDto } from '../../../../../interfaces/dtos/image-info-dto';
import { PostService } from '../../../../../services/post.service';
import { ModalService } from '../../../../../services/modal.service';

@Component({
  selector: 'app-image-selection-section',
  templateUrl: './image-selection-section.component.html',
  styleUrl: './image-selection-section.component.scss',
})
export class ImageSelectionSectionComponent implements OnInit {
  @Input() cities: PostCityDto[] = [];
  @Output() imageSelectionResponse = new EventEmitter<{
    imageInfo: ImageInfoDto | null;
    imageUploaded: boolean;
  }>();

  selectedCityId: string | null = null;
  selectedWaypointId: string | null = null;
  showWaypointDropdown: boolean = false;

  selectedCity: PostCityDto | null = null;
  selectedWaypoint: PostWaypointDto | null = null;
  uploadedImage: File | null = null;
  selectedImages: File[] = [];

  constructor(
    private postService: PostService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.selectedCityId = null;
    this.selectedWaypointId = null;
    this.selectedCity = null;
    this.selectedWaypoint = null;
    this.showWaypointDropdown = false;
  }

  onCityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCityId = select.value;
    this.selectedWaypointId = null;
    this.selectedWaypoint = null;

    this.uploadedImage?.name;

    if (this.selectedCityId === null) {
      this.showWaypointDropdown = false;
      this.selectedCity = null;
    }

    this.selectedCity =
      this.cities.find((city) => city.id === this.selectedCityId) || null;

    this.showWaypointDropdown = true;
  }

  onWaypointChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedWaypointId = select.value;

    if (this.selectedWaypointId === null) {
      this.selectedWaypoint = null;
      return;
    }

    this.selectedWaypoint =
      this.selectedCity?.waypoints.find(
        (waypoint) => waypoint.id === this.selectedWaypointId
      ) || null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadedImage = file;
    }
  }

  removeSelectedImage() {
    if (this.uploadedImage) {
      this.uploadedImage = null;
    } else {
      console.warn('No image selected to remove.');
    }
  }
  cancelImageSelection() {
    this.selectedCityId = null;
    this.selectedWaypointId = null;
    this.selectedCity = null;
    this.selectedWaypoint = null;
    this.showWaypointDropdown = false;

    // Emit an event to notify the parent component
    this.imageSelectionResponse.emit({
      imageUploaded: false,
      imageInfo: null,
    });
  }
  confirmImageSelection() {
    if (this.uploadedImage === null) {
      console.warn('No image selected to confirm.');
      return;
    }

    this.postService.saveImage(this.uploadedImage).subscribe({
      next: (imageUrl) => {
        const imageInfo = {
          imageUrl: imageUrl,
          cityId: this.selectedCityId,
          cityName: this.selectedCity?.name,
          waypointId: this.selectedWaypointId,
          waypointName: this.selectedWaypoint?.name,
        } as ImageInfoDto;

        this.imageSelectionResponse.emit({
          imageUploaded: true,
          imageInfo: imageInfo,
        });
      },
      error: (error) => {
        console.error('Error saving image:', error);
        this.modalService.snackbar(
          'Error saving image. Please try again later.',
          10000,
          false
        );
      },
    });
  }
}
