import { Injectable } from '@angular/core';
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

  async loadScriptAsync(): Promise<void> {
    try {
      await this.loader.importLibrary("places");
      GoogleMapsService.scriptLoadedFlag = true;
    } catch (exception) {
      console.error(exception);
      throw exception;
    }
  }

  async getOverlayViewAsync(): Promise<typeof google.maps.OverlayView> {
    const mapsLib = await google.maps.importLibrary('maps') as any;
    return mapsLib.OverlayView;
  }

  async getMarkerAsync(): Promise<typeof google.maps.marker.AdvancedMarkerElement> {
    const mapsLib = await google.maps.importLibrary('marker') as any;
    return mapsLib.AdvancedMarkerElement;
  }

  isScriptLoaded(): boolean {
    return GoogleMapsService.scriptLoadedFlag;
  }
}

