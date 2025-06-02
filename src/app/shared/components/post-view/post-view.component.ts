import { Component, Input } from '@angular/core';
import { PostDto } from '../../../interfaces/dtos/base-dtos/base-post-dto';
import { PostService } from '../../../services/post.service';
import { ModalService } from '../../../services/modal.service';
import { PostCommentDto } from '../../../interfaces/dtos/response/post-comment-dto';
import { PostBatch } from '../../../interfaces/enums/post-batch.enum';

@Component({
  selector: 'app-post-view',
  templateUrl: './post-view.component.html',
  styleUrl: './post-view.component.scss',
})
export class PostViewComponent {
  @Input() post!: PostDto;

  showComments: boolean = false;
  postComments: PostCommentDto[] = [];

  constructor(
    private postService: PostService,
    private modalService: ModalService
  ) {}
  
  getFirstLetterOf(name: string): string {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return 'N/A';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleLike(post: PostDto): void {
    this.postService.toggleLike(post.id).subscribe({
      next: () => {
        this.post.likesCount =
          this.post.likesCount + (this.post.isLiked ? -1 : 1);
        this.post.isLiked = !this.post.isLiked;
      },
      error: (error) => {
        this.modalService.snackbar(
          'Error toggling like. Please try again later.',
          10000,
          false
        );
        console.error('Error toggling like:', error);
      },
    });
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
    if (!this.showComments) {
      return;
    }

    this.postService.getPostComments(this.post.id).subscribe({
      next: (comments) => {
        this.postComments = comments;
      },
      error: (error) => {
        this.modalService.snackbar(
          'Error loading comments. Please try again later.',
          10000,
          false
        );
        console.error('Error loading comments:', error);
      },
    });
  }

  addComment(comment: string): void {
    if (!comment.trim()) {
      this.modalService.snackbar('Comment cannot be empty.', 3000, false);
      return;
    }
    this.postService.createComment(this.post.id, comment).subscribe({
      next: (newComment) => {
        this.postComments.unshift(newComment);
        this.post.commentsCount++;
      },
      error: (error) => {
        this.modalService.snackbar(
          'Error adding comment. Please try again later.',
          10000,
          false
        );
        console.error('Error adding comment:', error);
      },
    });
  }
}
