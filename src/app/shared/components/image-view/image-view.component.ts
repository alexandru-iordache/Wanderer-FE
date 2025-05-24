import { Component, Input, OnInit } from '@angular/core';
import { ImageInfoDto } from '../../../interfaces/dtos/image-info-dto';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss'
})
export class ImageViewComponent implements OnInit {
  @Input() imageInfo!: ImageInfoDto;
  @Input() width: string = '200px';
  @Input() height: string = '200px';
  @Input() borderRadius: string = '8px';
  @Input() onRemove: (() => void) | null = null;
  
  showModal: boolean = false;
  
  locationLabel: string | null = null;
  
  ngOnInit(): void {
    this.generateLocationLabel();
  }
  
  private generateLocationLabel(): void {
    if (this.imageInfo.waypointName && this.imageInfo.cityName) {
      this.locationLabel = `${this.imageInfo.waypointName}, ${this.imageInfo.cityName}`;
    } else if (this.imageInfo.cityName) {
      this.locationLabel = this.imageInfo.cityName;
    } else {
      this.locationLabel = null;
    }
  }
  
  openModal(event: Event): void {
    event.stopPropagation();
    if (!(event.target as HTMLElement).closest('.remove-button')) {
      this.showModal = true;
    }
  }
  
  closeModal(): void {
    this.showModal = false;
  }
  
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
