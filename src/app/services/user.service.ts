import { EnvironmentInjector, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AddUserDto } from '../interfaces/dtos/request/add-user-dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  async createUser(user: AddUserDto) {
    // const headers = await this.createHeaders();

    const response = await firstValueFrom(this.http.post(environment.apiUrl + '/api/users', user, { observe: 'response' }));
    return {
      statusCode: response.status,
      statusText: response.statusText,
      body: response.body
    };
  }

  private async createHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getIdToken();
    const headers = new HttpHeaders().set('Authorization', `${token}`);

    return headers;
  }
}
