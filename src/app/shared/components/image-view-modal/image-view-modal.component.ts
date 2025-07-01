import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-image-view-modal',
  templateUrl: './image-view-modal.component.html',
  styleUrl: './image-view-modal.component.scss'
})
export class ImageViewModalComponent {
  @Input() imageUrl!: string;
  @Input() locationLabel?: string | null;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
