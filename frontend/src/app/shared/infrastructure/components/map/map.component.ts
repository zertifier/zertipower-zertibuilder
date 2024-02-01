import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import Chart from "chart.js/auto";
import {Observable, Subject} from "rxjs";
import {waitForAsync} from "@angular/core/testing";
import {getLocaleFirstDayOfWeek} from "@angular/common";
import * as mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styles:`

  #map{
  object-fit: cover;
  width: 100%;
  max-height: 100%;
  border-radius: 6px;
  height: 85vh;
  min-height: 323.4px;
  }

  .custom-marker{
    background:url("/assets/marker-blue.png");
  }

  .custom-marker{
    max-width: 50px;
  }

`
})

export class AppMapComponent implements OnInit, AfterViewInit {

  private map!: mapboxgl.Map;
  leafletMap:any;
  @Input() input: string = '';
  //@ViewChild('map') mapContainer:any;
  // @ts-ignore
  latlngs: LatLongExpression = [
    [
      41.5050,1.5000
    ],
    [
      41.5055,1.4990
    ],
    [
      41.5060,1.4994
    ],
    [
      41.5050,1.5003
    ],
  ];

  // @ts-ignore
  latlngs2: LatLongExpression = [
    [
      41.5070,1.5000
    ],
    [
      41.5065,1.4990
    ],
    [
      41.5070,1.4994
    ],
    [
      41.5075,1.5003
    ],
  ];

  // @ts-ignore
  latlngs3: LatLongExpression = [
    [
      41.5070,1.5010
    ],
    [
      41.5065,1.5015
    ],
    [
      41.5075,1.5013
    ],
    [
      41.5070,1.5010
    ],
  ];

  // @ts-ignore
  latlngs4: LatLongExpression = [
    [
      41.5080,1.5020
    ],
    [
      41.5085,1.5035
    ],
    [
      41.5095,1.5023
    ],
    [
      41.5090,1.5020
    ],
  ];

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {

    /*let mapElements = this.mapContainer.querySelectorAll('.mapboxgl-canvas');
    mapElements[0]['style']['height'] = '100vh';*/

    this.leafletMap = L.map('map', {
      center: [1.5000, 41.5000],
      zoom: 13
    });

    let mapLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.leafletMap)

    /*let markerLayer = L.marker([1.500, 41.5]).addTo(this.leafletMap);
    markerLayer.addTo(this.leafletMap)*/

    /*this.map = new mapboxgl.Map({
      accessToken: 'pk.eyJ1IjoiYWZhYnJhIiwiYSI6ImNscmYxMWg4azAwYzEybW11eXFtMDlpYzAifQ.7E2Ku-3YQNBgAXuuxU4izw',
      container: 'map', // container ID
      // style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [1.5, 41.5], // starting position [lng, lat]
      zoom: 7 // starting zoom
    });*/


    const polygon = L.polygon(this.latlngs, {color: 'red'}).addTo(this.leafletMap);
    this.leafletMap.fitBounds(polygon.getBounds());

    const polygon2 = L.polygon(this.latlngs2, {color: 'red'}).addTo(this.leafletMap);

    const polygon3 = L.polygon(this.latlngs3, {color: 'red'}).addTo(this.leafletMap);

    const polygon4 = L.polygon(this.latlngs4, {color: 'red'}).addTo(this.leafletMap);

  }

  ngAfterViewInit() {
   // this.map.resize(); // Ajusta el tamaño del mapa después de la inicialización
  }

  addMarker(lat:any,long:any) {
    var customMarker = L.icon({iconUrl:'/assets/marker-blue.png',iconSize:[38, 60],popupAnchor: [-3, -76]})
    let markerLayer = L.marker([lat,long],{icon:customMarker}).addTo(this.leafletMap);
    markerLayer.addTo(this.leafletMap)
    this.leafletMap.setView([lat,long])
    return markerLayer;
  }

  addCircle(lat:number,lng:number,radius:number){
    L.circle([lat,lng], {radius:radius}).addTo(this.leafletMap);
  }

}


/*
console.log(long,lat)
const marker = new mapboxgl.Marker()
  .setLngLat([long, lat])
  .addTo(this.map);

this.map.on('move', () => {
  const lngLat = marker.getLngLat();
  marker.setLngLat(lngLat).addTo(this.map);
});
*/
