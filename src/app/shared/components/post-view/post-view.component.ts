import { Component, Input } from '@angular/core';
import { PostDto } from '../../../interfaces/dtos/base-dtos/base-post-dto';

@Component({
  selector: 'app-post-view',
  templateUrl: './post-view.component.html',
  styleUrl: './post-view.component.scss'
})
export class PostViewComponent {
  @Input() post!: PostDto;

  getFirstLetterOfName(): string {
    if (this.post.userInfo.profileName) {
      return this.post.userInfo.profileName.charAt(0).toUpperCase();
    }
    return 'N/A';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }
}
