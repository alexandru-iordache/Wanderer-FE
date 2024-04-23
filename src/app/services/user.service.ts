import { EnvironmentInjector, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  async getUsernameExistence(username: string) {
    const headers = await this.createHeaders();

    return this.http.get(environment.apiUrl + '/users/username=' + username, { }).toPromise();
  }

  private async createHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getIdToken();
    const headers = new HttpHeaders().set('Authorization', `${token}`);

    return headers;
  }
}
