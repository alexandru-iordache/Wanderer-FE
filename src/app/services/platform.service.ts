import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { SearchResponseDto } from '../interfaces/dtos/response/search-response-dto';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private apiUrl = environment.apiUrl + '/api/platform';

  constructor(private http: HttpClient) {}

  search(searchText: string): Observable<SearchResponseDto[]> {
    return this.http
      .get(`${this.apiUrl}/search?searchText=${searchText}`, {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(map((response: any) => response.body as SearchResponseDto[]));
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
