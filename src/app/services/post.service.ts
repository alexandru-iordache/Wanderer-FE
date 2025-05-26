import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';
import { AddPostDto, PostDto } from '../interfaces/dtos/base-dtos/base-post-dto';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = environment.apiUrl + '/api/posts';

  constructor(private http: HttpClient) {}

  saveImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post(`${this.apiUrl}/image`, formData, {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(
        map((response: any) => {
          const object = response.body as { imageUrl: string };
          return object.imageUrl; 
        })
      );
  }

  createPost(post: AddPostDto) {
    return this.http
      .post(`${this.apiUrl}`, post, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((response: any) => {
          const object = response.body as PostDto;
          return object; 
        })
      );
  }

  private createHeaders(): HttpHeaders {
    const token =
      sessionStorage.getItem('idToken') || localStorage.getItem('idToken');
    if (!token) {
      throw new Error('Token not found in storage');
    }
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const userId =
      sessionStorage.getItem('userId') || localStorage.getItem('userId');
    headers = headers.append('X-UserId', userId || '');
    return headers;
  }
}
