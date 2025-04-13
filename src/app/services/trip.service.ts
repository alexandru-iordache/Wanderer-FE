import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddTripDto, TripDto } from '../interfaces/dtos/request/base-trip-dto';
import { Uuid } from '../shared/helpers/uuid';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private apiUrl = environment.apiUrl + '/api/trips';

  constructor(private http: HttpClient) {}

  getTripById(id: string): Observable<TripDto> {
    return this.http
      .get(`${this.apiUrl}/${id}`)
      .pipe(map((response: any) => response.data as TripDto));
  }

  getTrips(): Observable<TripDto[]> {
    return this.http
      .get(`${this.apiUrl}`)
      .pipe(map((response: any) => response.data as TripDto[]));
  }

  async createTrip(trip: AddTripDto) {
    const response = await firstValueFrom(
      this.http.post(`${this.apiUrl}`, trip, {
        observe: 'response',
        headers: this.createHeaders(),
      })
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      body: response.body as TripDto,
    };
  }

  async updateTrip(id: Uuid, trip: TripDto) {
    const response = await firstValueFrom(
      this.http.put(`${this.apiUrl}` + `/${id}`, trip, {
        observe: 'response',
        headers: this.createHeaders(),
      })
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      body: response.body as TripDto,
    };
  }

  private createHeaders(): HttpHeaders {
    const token =
      sessionStorage.getItem('idToken') || localStorage.getItem('idToken');
    if (!token) {
      throw new Error('Token not found in storage');
    }
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    headers = headers.append('X-UserId', userId || '');
    return headers;
  }
}
