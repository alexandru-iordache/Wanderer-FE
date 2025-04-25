import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  @Input() header: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = 'Confirm';
  @Input() discardText: string = 'Discard';
  @Input() showDiscardButton: boolean = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void { }

  onConfirm(): void {
    this.confirm.emit();
  }

  onDiscard(): void {
    this.discard.emit();
  }
}
