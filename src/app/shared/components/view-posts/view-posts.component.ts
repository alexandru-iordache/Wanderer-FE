import { Component, Input, OnInit } from '@angular/core';
import { Uuid } from '../../../shared/helpers/uuid';
import { PostService } from '../../../services/post.service';
import { PostDto } from '../../../interfaces/dtos/base-dtos/base-post-dto';
import { UserService } from '../../../services/user.service';
import { PostBatch } from '../../../interfaces/enums/post-batch.enum';

@Component({
  selector: 'app-view-posts',
  templateUrl: './view-posts.component.html',
  styleUrl: './view-posts.component.scss'
})
export class ViewPostsComponent implements OnInit {
  @Input() userId!: Uuid;
  @Input() batchType: PostBatch = PostBatch.USER_POSTS;
  
  userPosts: PostDto[] = [];
  isLoading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if(this.batchType){
      this.loadUserPosts();
    }
  }

  loadUserPosts(): void {
    this.isLoading = true;
    
    this.userService.getUserPosts(this.userId).subscribe({
      next: (posts) => {
        this.userPosts = posts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching user posts:', error);
        this.isLoading = false;
      }
    });
  }
}
