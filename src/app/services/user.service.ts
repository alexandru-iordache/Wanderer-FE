import { EnvironmentInjector, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, firstValueFrom, map, Observable } from 'rxjs';
import { AddUserDto } from '../interfaces/dtos/request/add-user-dto';
import { UserDto } from '../interfaces/dtos/response/user-dto';
import { UserStatsDto } from '../interfaces/dtos/response/user-stats-dto';
import { UpdateUserDto } from '../interfaces/dtos/request/update-user-dto';
import { UserProfileDto } from '../interfaces/dtos/response/user-profile-dto';
import { Uuid } from '../shared/helpers/uuid';
import { FilterOptionsDto } from '../interfaces/dtos/filter-options-dto';
import { TripDto } from '../interfaces/dtos/base-dtos/base-trip-dto';
import { PostDto } from '../interfaces/dtos/base-dtos/base-post-dto';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userStatsChanged = new BehaviorSubject<number>(0);
  private userDetailsChanged = new BehaviorSubject<UserDto | null>(null);

  constructor(private http: HttpClient, private authService: AuthService) {}

  async createUser(user: AddUserDto) {
    try {
      const response = await firstValueFrom(
        this.http.post(environment.apiUrl + '/api/users', user, {
          observe: 'response',
          headers: this.createHeaders(),
        })
      );
      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: response.body as UserDto,
      };
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status !== 409) {
          console.error('Bad Request:', error.error);
          throw error;
        }

        return {
          statusCode: 409,
          statusText: 'Conflict',
          body: null,
        };
      } else {
        console.error('Unexpected Error:', error);
        throw error;
      }
    }
  }

  updateUser(updatedUser: UpdateUserDto) {
    return this.http
      .put(environment.apiUrl + `/api/users/${updatedUser.id}`, updatedUser, {
        observe: 'response',
        headers: this.createHeaders(),
      })
      .pipe(map((response: any) => response.body as UserDto));
  }

  changeFollowingStatus(userId: Uuid) {
    return this.http
      .post(
        environment.apiUrl + `/api/users/${userId}/follow`,
        {},
        {
          observe: 'response',
          headers: this.createHeaders(),
        }
      )
      .pipe(map((response: any) => response.body as UserDto));
  }

  async getUserDetailsAsync() {
    const response = await firstValueFrom(
      this.http.get(environment.apiUrl + '/api/users/details', {
        observe: 'response',
        headers: this.createHeaders(),
      })
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      body: response.body as UserDto,
    };
  }

  getUserDetails(): Observable<UserDto> {
    return this.http
      .get(environment.apiUrl + '/api/users/details', {
        observe: 'response',
        headers: this.createHeaders(),
      })
      .pipe(map((response: any) => response.body as UserDto));
  }

  getUserTrips(
    userId: Uuid,
    isOrderedByDate: boolean,
    filterOptions: FilterOptionsDto
  ): Observable<TripDto[]> {
    return this.http
      .get(this.createGetRoute(userId, isOrderedByDate, filterOptions), {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(map((response: any) => response.body as TripDto[]));
  }

  getUserPosts(userId: Uuid): Observable<PostDto[]> {
    return this.http
      .get(`${environment.apiUrl}/api/users/${userId}/posts`, {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(map((response: any) => response.body as PostDto[]));
  }

  getUserFeed(userId: Uuid, top: number, skip: number): Observable<PostDto[]> {
    return this.http
      .get(`${environment.apiUrl}/api/users/${userId}/feed?top=${top}&skip=${skip}`, {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(map((response: any) => response.body as PostDto[]));
  }

  getUserProfile(userId: string): Observable<UserProfileDto> {
    return this.http
      .get(environment.apiUrl + `/api/users/${userId}/profile`, {
        observe: 'response',
        headers: this.createHeaders(),
      })
      .pipe(map((response: any) => response.body as UserProfileDto));
  }

  getUserStats(isCompleted: boolean) {
    return this.http
      .get(environment.apiUrl + `/api/users/stats?isCompleted=${isCompleted}`, {
        observe: 'response',
        headers: this.createHeaders(),
      })
      .pipe(map((response: any) => response.body as UserStatsDto));
  }

  updateUserStatsChanged() {
    this.userStatsChanged.next(this.userStatsChanged.value + 1);
  }

  getUserStatsChanged(): Observable<number> {
    return this.userStatsChanged.asObservable();
  }

  updateUserDetailsChanged(userDetails: UserDto | null) {
    this.userDetailsChanged.next(userDetails);
  }

  getUserDetailsChanged(): Observable<UserDto | null> {
    return this.userDetailsChanged.asObservable();
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

  private createGetRoute(
    userId: Uuid,
    isOrderedByDate: boolean,
    filterOptions: FilterOptionsDto
  ): string {
    const params = new URLSearchParams();

    if (filterOptions.completionStatus) {
      params.append('status', filterOptions.completionStatus);
    }
    if (filterOptions.minDate) {
      params.append('minDate', filterOptions.minDate.toISOString());
    }
    if (filterOptions.maxDate) {
      params.append('maxDate', filterOptions.maxDate.toISOString());
    }
    if (filterOptions.isPublished) {
      params.append('isPublished', filterOptions.isPublished.toString());
    }

    return (
      environment.apiUrl +
      `/api/users/${userId}/trips?isOrderedByDate=${isOrderedByDate}&${params.toString()}`
    );
  }
}
