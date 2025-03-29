import { EventEmitter, Injectable } from '@angular/core';
import { CityTransferDto } from '../interfaces/dtos/city-transfer-dto';
import { AddWaypointDto } from '../interfaces/dtos/add-waypoint-dto';

@Injectable({
  providedIn: 'root',
})
export class GoogleComponentsFactoryService {
  constructor() {}

  createCityOverlay(
    position: google.maps.LatLngLiteral,
    city: CityTransferDto,
    updateCityToAdd: (cityTransferDto: CityTransferDto | undefined) => void
  ) {
    class CityOverlay extends google.maps.OverlayView {
      position: google.maps.LatLngLiteral;
      div: HTMLElement | null = null;
      city: CityTransferDto;
      updateCityToAdd: (cityTransferDto: CityTransferDto | undefined) => void

      constructor(
        position: google.maps.LatLngLiteral,
        city: CityTransferDto,
        updateCityToAdd: (cityTransferDto: CityTransferDto | undefined) => void
      ) {
        super();
        this.city = city;
        this.position = position;
        this.updateCityToAdd = updateCityToAdd;
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
          this.updateCityToAdd(this.city);
          this.setMap(null);
        });

        const closeButton = div.querySelector(
          '#close-overlay-btn'
        ) as HTMLButtonElement;
        closeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          this.setMap(null);
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

    return new CityOverlay(position, city, updateCityToAdd);
  }

  createWaypointOverlay(
    position: google.maps.LatLngLiteral,
    waypoint: AddWaypointDto,
    updateWaypointToAdd: (addWaypointDto: AddWaypointDto | undefined) => void
  ) {
    class WaypointOverlay extends google.maps.OverlayView {
      position: google.maps.LatLngLiteral;
      div: HTMLElement | null = null;
      waypoint: AddWaypointDto;
      updateWaypointToAdd: (addWaypointDto: AddWaypointDto | undefined) => void

      constructor(
        position: google.maps.LatLngLiteral,
        waypoint: AddWaypointDto,
        updateWaypointToAdd: (addWaypointDto: AddWaypointDto | undefined) => void
      ) {
        super();
        this.waypoint = waypoint;
        this.position = position;
        this.updateWaypointToAdd = updateWaypointToAdd;
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
                    <h1 style="color: #283618;">${this.waypoint.name}, ${this.waypoint.order}</h1>
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
          this.updateWaypointToAdd(this.waypoint);
          this.setMap(null);
        });

        const closeButton = div.querySelector(
          '#close-overlay-btn'
        ) as HTMLButtonElement;
        closeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          this.setMap(null);
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

    return new WaypointOverlay(position, waypoint, updateWaypointToAdd);
  }

  createMarker(
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    markerTitle: string,
    relatedEntity: object,
    iconUrl?: string,
    clickHandler?: (relatedEntity: object) => void,
    order?: number
  ) {
    const markerContent = document.createElement('div');
    markerContent.style.position = 'relative';
    markerContent.style.width = '30px';
    markerContent.style.height = '40px';
    markerContent.style.display = 'flex';
    markerContent.style.flexDirection = "column";
    markerContent.style.justifyContent = 'flex-start';
    markerContent.style.alignItems = 'center';
    markerContent.style.cursor = "pointer";
    markerContent.style.zIndex = "99";
    markerContent.innerHTML = `
       <div style="
      background-color: #B7B192;
      border: 2px solid #283618;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      color: #FFF;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1;
    ">
      ${order !== undefined ? order : ''}
    </div>
    <div style="
      position: relative;
      margin-top: 1px;
      bottom: 0;
      width: 0;
      height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 8px solid #283618;
      border-top-radius: 40%;
      z-index: 0;
    "></div>
    `;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map,
      title: markerTitle,
      content: markerContent,
      zIndex: 1000
    });

    if (clickHandler) {
      markerContent.addEventListener('click', () => clickHandler(relatedEntity));
    }

    return marker;
  }
}
