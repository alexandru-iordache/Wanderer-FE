import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent implements OnInit, OnDestroy {
  @Input() message: string = '';
  @Input() duration: number = 5000;
  @Input() successfullFeedback: boolean = true;
  @Output() close = new EventEmitter<void>();
  
  private timeoutId: any;
  
  ngOnInit(): void {
    if (this.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.onClose();
      }, this.duration);
    }
  }
  
  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
  
  onClose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.close.emit();
  }
}
