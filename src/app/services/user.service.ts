import { EnvironmentInjector, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, map, Observable } from 'rxjs';
import { AddUserDto } from '../interfaces/dtos/request/add-user-dto';
import { UserDto } from '../interfaces/dtos/response/user-dto';
import { UserStatsDto } from '../interfaces/dtos/response/user-stats-dto';
import { UpdateUserDto } from '../interfaces/dtos/request/update-user-dto';
import { UserProfileDto } from '../interfaces/dtos/response/user-profile-dto';

@Injectable({
  providedIn: 'root',
})
export class UserService {
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
