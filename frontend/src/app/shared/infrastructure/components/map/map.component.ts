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
  }

  ngAfterViewInit() {
   // this.map.resize(); // Ajusta el tamaño del mapa después de la inicialización
  }

  addMarker(long:any, lat:any) {

    /*console.log(long,lat)
    const marker = new mapboxgl.Marker()
      .setLngLat([long, lat])
      .addTo(this.map);

    this.map.on('move', () => {
      const lngLat = marker.getLngLat();
      marker.setLngLat(lngLat).addTo(this.map);
    });*/

    var customMarker = L.icon({iconUrl:'/assets/marker-blue.png',iconSize:[38, 60],popupAnchor: [-3, -76]})

    let markerLayer = L.marker([lat,long],{icon:customMarker}).addTo(this.leafletMap);
    markerLayer.addTo(this.leafletMap)
    this.leafletMap.setView([lat,long])


  }

}
