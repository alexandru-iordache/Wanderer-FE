import { Component, Input, OnInit } from '@angular/core';
import { BaseImageInfoDto } from '../../../interfaces/dtos/base-dtos/base-image-info-dto';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss'
})
export class ImageViewComponent implements OnInit {
  @Input() imageInfo!: BaseImageInfoDto;
  @Input() width: string = '200px';
  @Input() height: string = '200px';
  @Input() borderRadius: string = '8px';
  @Input() onRemove: (() => void) | null = null;
  
  locationLabel: string | null = null;
  
  constructor(private modalService: ModalService) {}
  
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
      this.modalService.showImageModal(this.imageInfo.imageUrl, this.locationLabel);
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
