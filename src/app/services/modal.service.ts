import {
  Injectable,
  ComponentFactoryResolver,
  Injector,
  ApplicationRef,
  ComponentRef,
  Type,
} from '@angular/core';
import { ModalComponent } from '../shared/components/modal/modal.component';
import { SnackbarComponent } from '../shared/components/snackbar/snackbar.component';
import { CreatePostModalComponent } from '../shared/components/create-post-modal/create-post-modal.component';
import { ImageViewModalComponent } from '../shared/components/image-view-modal/image-view-modal.component';
import { Uuid } from '../shared/helpers/uuid';
import { TripDto } from '../interfaces/dtos/base-dtos/base-trip-dto';

export interface ModalOptions {
  header: string;
  message: string;
  confirmText?: string;
  discardText?: string;
}

export interface CreatePostModalOptions {
  tripId: Uuid;
}

export interface ImageViewModalOptions {
  imageUrl: string;
  locationLabel?: string | null;
}

export interface SnackbarOptions {
  message: string;
  duration?: number; // Duration in milliseconds
  successfullFeedback?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalComponentRef: ComponentRef<ModalComponent> | null = null;
  private createPostModalComponentRef: ComponentRef<CreatePostModalComponent> | null =
    null;
  private imageViewModalComponentRef: ComponentRef<ImageViewModalComponent> | null = null;
  private snackbarComponentRef: ComponentRef<SnackbarComponent> | null = null;

  constructor(private appRef: ApplicationRef) {}

  snackbar(
    message: string,
    duration: number = 5000,
    successfullFeedback: boolean = true
  ): void {
    this.showSnackbar({ message, duration, successfullFeedback });
  }

  private showSnackbar(options: SnackbarOptions): void {
    const { message, duration = 5000 } = options;
    this.closeSnackbar();

    const snackbarElement = document.createElement('div');
    this.snackbarComponentRef = this.appRef.bootstrap(
      SnackbarComponent,
      snackbarElement
    );

    let instance = this.snackbarComponentRef!.instance as SnackbarComponent;

    instance.message = message;
    instance.duration = duration;
    instance.successfullFeedback =
      options.successfullFeedback !== undefined
        ? options.successfullFeedback
        : true;

    const closeSub = instance.close.subscribe(() => {
      closeSub.unsubscribe();
      this.closeSnackbar();
    });

    this.appRef.attachView(this.snackbarComponentRef!.hostView);

    const domElement = (this.snackbarComponentRef!.hostView as any)
      .rootNodes[0];
    document.body.appendChild(domElement);
  }

  confirmDelete(entityType: string, entityName: string): Promise<boolean> {
    return this.confirm({
      header: `Delete ${entityName}`,
      message: `Are you sure you want to delete this ${entityType}?`,
      confirmText: 'Confirm',
      discardText: 'Discard',
    });
  }

  confirmCompleteTrip(
    entityType: string,
    entityName: string
  ): Promise<boolean> {
    return this.confirm({
      header: `Complete ${entityName}`,
      message: `Are you sure you want to complete the ${entityName} trip?`,
      confirmText: 'Confirm',
      discardText: 'Discard',
    });
  }

  confirmPublishTrip(entityName: string): Promise<boolean> {
    return this.confirm({
      header: `Publish Trip ${entityName}`,
      message: `Are you sure you want to publish this trip?`,
      confirmText: 'Confirm',
      discardText: 'Discard',
    });
  }

  confirmCreatePost(entityName: string): Promise<boolean> {
    return this.confirm({
      header: `Create Post for Trip ${entityName}`,
      message: `Do you want also to create a post for this trip?`,
      confirmText: 'Yes',
      discardText: 'No',
    });
  }

  createPost(
   tripId: Uuid
  ){
    return new Promise<boolean>((resolve) => {
      this.openCreatePostModal({ tripId: tripId }, resolve);
    });
  }

  showImageModal(imageUrl: string, locationLabel?: string | null): void {
    this.openImageModal({ imageUrl, locationLabel });
  }

  confirm(options: ModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.openModal(options, resolve);
    });
  }

  private openModal(
    options: ModalOptions,
    resolve: (value: boolean) => void
  ): void {
    this.closeModal();

    const modalElement = document.createElement('div');
    this.modalComponentRef = this.appRef.bootstrap(
      ModalComponent,
      modalElement
    );

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

  private openCreatePostModal(
    options: CreatePostModalOptions,
    resolve: (value: boolean) => void
  ): void {
    this.closeModal();

    const modalElement = document.createElement('div');
    this.createPostModalComponentRef = this.appRef.bootstrap(
      CreatePostModalComponent,
      modalElement
    );

    let instance = this.createPostModalComponentRef!
      .instance as CreatePostModalComponent;

    instance.tripId = options.tripId;

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

    this.appRef.attachView(this.createPostModalComponentRef!.hostView);

    const domElement = (this.createPostModalComponentRef!.hostView as any).rootNodes[0];
    document.body.appendChild(domElement);
    
    if (instance.ngOnInit) {
      instance.ngOnInit();
    }
  }

  private openImageModal(options: ImageViewModalOptions): void {
    this.closeModal();

    const modalElement = document.createElement('div');
    this.imageViewModalComponentRef = this.appRef.bootstrap(
      ImageViewModalComponent,
      modalElement
    );

    let instance = this.imageViewModalComponentRef!.instance as ImageViewModalComponent;

    instance.imageUrl = options.imageUrl;
    instance.locationLabel = options.locationLabel;

    const closeSub = instance.closeModal.subscribe(() => {
      closeSub.unsubscribe();
      this.closeModal();
    });

    this.appRef.attachView(this.imageViewModalComponentRef!.hostView);

    const domElement = (this.imageViewModalComponentRef!.hostView as any).rootNodes[0];
    document.body.appendChild(domElement);
  }

  private closeModal(): void {
    if (this.modalComponentRef) {
      this.appRef.detachView(this.modalComponentRef.hostView);
      this.modalComponentRef.destroy();
      this.modalComponentRef = null;
    }

    if (this.createPostModalComponentRef) {
      this.appRef.detachView(this.createPostModalComponentRef.hostView);
      this.createPostModalComponentRef.destroy();
      this.createPostModalComponentRef = null;
    }

    if (this.imageViewModalComponentRef) {
      this.appRef.detachView(this.imageViewModalComponentRef.hostView);
      this.imageViewModalComponentRef.destroy();
      this.imageViewModalComponentRef = null;
    }
  }

  private closeSnackbar(): void {
    if (this.snackbarComponentRef) {
      this.appRef.detachView(this.snackbarComponentRef.hostView);
      this.snackbarComponentRef.destroy();
      this.snackbarComponentRef = null;
    }
  }
}
