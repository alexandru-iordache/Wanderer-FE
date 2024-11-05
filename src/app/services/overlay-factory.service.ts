import { EventEmitter, Injectable } from '@angular/core';
import { City } from '../interfaces/city';

@Injectable({
  providedIn: 'root',
})
export class OverlayFactoryService {
  constructor() {}

  createCityOverlay(
    position: google.maps.LatLngLiteral,
    city: City,
    cityAdded: EventEmitter<{ city: City }>
  ) {
    class CityOverlay extends google.maps.OverlayView {
      position: google.maps.LatLngLiteral;
      div: HTMLElement | null = null;
      city: City;
      cityAdded: EventEmitter<{ city: City }>;

      constructor(
        position: google.maps.LatLngLiteral,
        city: City,
        cityAdded: EventEmitter<{ city: City }>
      ) {
        super();
        this.city = city;
        this.position = position;
        this.cityAdded = cityAdded;
      }

      override onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.padding = '10px';
        div.style.backgroundColor = '#FFFDF3';
        div.style.color = '#283618';
        div.style.border = '3px solid #283618';
        div.style.borderRadius = '10px';
        div.style.cursor = 'default';
        div.innerHTML = `
                <button id="close-overlay-btn" style="position: absolute; top: 2px; right: 4px; font-size: 20px; 
                background: none; border: none; cursor: pointer;">
                &times;
                </button>
                <div style="position: relative; margin-top: 10px;">
                    <h1 style="color: #283618;">${this.city.name}, ${this.city.country}</h1>
                    <button id="add-city-btn" style="padding: 5px; margin-top: 5px; 
                    background-color: #283618; color: #FFFDF3; border: 2px solid #12170C; border-radius: 5px; cursor: pointer;">
                    Add city
                    </button>
                </div>
              `;
        this.div = div;

        const panes = this.getPanes();
        panes!.overlayMouseTarget.appendChild(div);

        const button = div.querySelector('#add-city-btn') as HTMLButtonElement;
        button?.addEventListener('click', (event) => {
          event.stopPropagation();
          this.cityAdded.emit({ city: city });
          console.log('City Added Event emitted.');
          this.setMap(null);
        });

        const closeButton = div.querySelector(
          '#close-overlay-btn'
        ) as HTMLButtonElement;
        closeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          this.setMap(null);
          console.log('Overlay closed.');
        });
      }

      override draw() {
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.position)
        );

        if (position && this.div) {
          this.div.style.left = position.x + 'px';
          this.div.style.top = position.y + 'px';
        }
      }

      override onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
        }
      }
    }

    return new CityOverlay(position, city, cityAdded);
  }
}
