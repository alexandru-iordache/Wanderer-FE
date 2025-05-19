import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddTripDto, TripDto } from '../interfaces/dtos/request/base-trip-dto';
import { Uuid } from '../shared/helpers/uuid';
import { FilterOptionsDto } from '../interfaces/dtos/filter-options-dto';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private apiUrl = environment.apiUrl + '/api/trips';

  constructor(private http: HttpClient) {}

  async getTripById(id: string) {
    const response = await firstValueFrom(
      this.http.get(`${this.apiUrl}/${id}`, {
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

  getTrips(isOrderedByDate: boolean, filterOptions: FilterOptionsDto): Observable<TripDto[]> {    
    return this.http
      .get(this.createGetRoute(isOrderedByDate, filterOptions), {
        headers: this.createHeaders(),
        observe: 'response',
      })
      .pipe(map((response: any) => response.body as TripDto[]));
  }

  async deleteTrip(id: Uuid) {
    const response = await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`, {
        headers: this.createHeaders(),
        observe: 'response',
      })
    );

    return {
      statusCode: response.status,
      statusText: response.statusText,
      body: response.body as TripDto,
    };
  }

  completeTrip(id: Uuid): Observable<TripDto> {
    return this.http
      .post(`${this.apiUrl}/${id}/complete`, {}, { headers: this.createHeaders(),  observe: 'response' })
      .pipe(map((response: any) => response.body as TripDto));
  }

  publishTrip(id: Uuid): Observable<TripDto> {
    return this.http
      .post(`${this.apiUrl}/${id}/publish`, {}, { headers: this.createHeaders(),  observe: 'response' })
      .pipe(map((response: any) => response.body as TripDto));
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

    const userId =
      sessionStorage.getItem('userId') || localStorage.getItem('userId');
    headers = headers.append('X-UserId', userId || '');
    return headers;
  }

  private createGetRoute(isOrderedByDate: boolean, filterOptions: FilterOptionsDto): string {
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

    return `${this.apiUrl}?isOrderedByDate=${isOrderedByDate}&${params.toString()}`;
  }
}
