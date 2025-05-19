import { Injectable, ComponentFactoryResolver, Injector, ApplicationRef, ComponentRef, Type } from '@angular/core';
import { ModalComponent } from '../shared/components/modal/modal.component';

export interface ModalOptions {
  header: string;
  message: string;
  confirmText?: string;
  discardText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalComponentRef: ComponentRef<ModalComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  confirm(options: ModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.openModal(options, resolve);
    });
  }

  confirmDelete(entityType: string, entityName: string): Promise<boolean> {
    return this.confirm({
      header: `Delete ${entityName}`,
      message: `Are you sure you want to delete this ${entityType}?`,
      confirmText: 'Confirm',
      discardText: 'Discard',
    });
  }

  confirmCompleteTrip(entityType: string, entityName: string): Promise<boolean> {
    return this.confirm({
      header: `Complete ${entityName}`,
      message: `Are you sure you want to complete the ${entityName} trip?`,
      confirmText: 'Confirm',
      discardText: 'Discard',
    });
  }

  alert(message: string, header: string = 'Alert'): Promise<boolean> {
    return this.confirm({
      header: header,
      message: message,
      confirmText: 'OK',
      discardText: '',
    });
  }

  private openModal(options: ModalOptions, resolve: (value: boolean) => void): void {
    this.closeModal();
    
    const modalElement = document.createElement('div');
    this.modalComponentRef = this.appRef.bootstrap(ModalComponent, modalElement);
    
    let instance = this.modalComponentRef!.instance as ModalComponent;

    instance.header = options.header;
    instance.message = options.message;
    instance.confirmText = options.confirmText || 'Confirm';
    instance.discardText = options.discardText || 'Discard';
    instance.showDiscardButton = options.discardText !== '';

    const confirmSub = instance.confirm.subscribe(() => {
      confirmSub.unsubscribe();
      discardSub.unsubscribe();
      this.closeModal();
      resolve(true);
    });
    
    const discardSub = instance.discard.subscribe(() => {
      confirmSub.unsubscribe();
      discardSub.unsubscribe();
      this.closeModal();
      resolve(false);
    });
    
    this.appRef.attachView(this.modalComponentRef!.hostView);
    
    const domElement = (this.modalComponentRef!.hostView as any).rootNodes[0];
    document.body.appendChild(domElement);
  }

  private closeModal(): void {
    if (this.modalComponentRef) {
      this.appRef.detachView(this.modalComponentRef.hostView);
      this.modalComponentRef.destroy();
      this.modalComponentRef = null;
    }
  }
}
