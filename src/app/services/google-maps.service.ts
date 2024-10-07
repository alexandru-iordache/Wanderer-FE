import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Loader } from '@googlemaps/js-api-loader';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private static scriptLoadedFlag = false;
  private loader = new Loader({
    apiKey: environment.googleMapsApiKey,
    libraries: ["places"],
  });

  constructor() {
  }

  async loadScript(): Promise<void> {
    try {
      await this.loader.importLibrary("places");
      console.log('Google Maps Loaded');
      GoogleMapsService.scriptLoadedFlag = true;
    } catch (exception) {
      console.error(exception);
      throw exception;
    }
  }

  async isScriptLoaded(): Promise<boolean> {
    return GoogleMapsService.scriptLoadedFlag;
  }
}

