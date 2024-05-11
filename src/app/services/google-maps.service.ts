import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private scriptLoaded = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadScript();
  }

  loadScript(): void {
    if (document.querySelector('script[src*="googleapis.com/maps/api/js"]')) {
      this.scriptLoaded.next(true);
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&loading=async&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded.next(true);
      };
      script.onerror = (error: any) => {
        this.scriptLoaded.error(`Failed to load Google Maps script: ${error}`);
      }

      document.head.appendChild(script);
    }
  }

  isScriptLoaded(): Observable<boolean> {
    return this.scriptLoaded.asObservable();
  }
}

