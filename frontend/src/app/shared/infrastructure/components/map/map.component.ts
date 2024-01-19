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
`
})

export class AppMapComponent implements OnInit, AfterViewInit {

  private map!: mapboxgl.Map;
  @Input() input: string = '';
  //@ViewChild('map') mapContainer:any;

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {

    /*let mapElements = this.mapContainer.querySelectorAll('.mapboxgl-canvas');
    mapElements[0]['style']['height'] = '100vh';*/

    this.map = new mapboxgl.Map({
      accessToken: 'pk.eyJ1IjoiYWZhYnJhIiwiYSI6ImNscmYxMWg4azAwYzEybW11eXFtMDlpYzAifQ.7E2Ku-3YQNBgAXuuxU4izw',
      container: 'map', // container ID
      // style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [1.5, 41.5], // starting position [lng, lat]
      zoom: 7 // starting zoom
    });
  }

  ngAfterViewInit() {
   // this.map.resize(); // Ajusta el tamaño del mapa después de la inicialización
  }

  addMarker(long:any, lat:any) {
    console.log(long,lat)
    const marker = new mapboxgl.Marker()
      .setLngLat([long, lat])
      .addTo(this.map);

    this.map.on('move', () => {
      const lngLat = marker.getLngLat();
      marker.setLngLat(lngLat).addTo(this.map);
    });
  }

}
