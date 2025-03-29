import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddTripDto, TripDto } from '../interfaces/dtos/request/base-trip-dto';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTripById(id: string): Observable<TripDto> {
    return this.http.get(`${this.apiUrl}/trips/${id}`).pipe(
      map((response: any) => response.data as TripDto));
  }

  getTrips(): Observable<TripDto[]> {
    return this.http.get(`${this.apiUrl}/trips`).pipe(
      map((response: any) => response.data as TripDto[]));
  }

  createTrip(trip: AddTripDto): Observable<TripDto> {
    return this.http.post(`${this.apiUrl}/trips`, trip).pipe(
      map((response: any) => response.data as TripDto));
  }
}