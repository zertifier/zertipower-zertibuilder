import {
  AfterViewInit,
  ChangeDetectorRef,
  Component, ElementRef,
  Input,
  OnInit, ViewChild,
} from "@angular/core";
import {GoogleMap} from '@angular/google-maps';

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

/* mapa.component.css */
#mapContainer {
  height: 400px;
  width: 100%;
}

`
})

export class AppMapComponent implements AfterViewInit {

  @ViewChild('mapContainer', {static: false}) gmap!: ElementRef;
  map!: google.maps.Map;

  lat = 41.505;
  lng = 1.509;
  polygonT = [{lat:this.lat,lng:this.lng},{lat:this.lng,lng:this.lat}]

  coordinates = new google.maps.LatLng(this.lat, this.lng);
  mapOptions: google.maps.MapOptions = {
    center: this.coordinates,
    zoom: 8
  };

  constructor(private cdr: ChangeDetectorRef) {}


  ngAfterViewInit() {
    this.mapInitializer();
  }

  mapInitializer() {
    this.map = new google.maps.Map(this.gmap.nativeElement, this.mapOptions);
    const marker = new google.maps.Marker({
      position: this.coordinates,
      map: this.map,
      clickable: true
    });
    const polygon = new google.maps.Polygon({
      paths: this.polygonT,
      map: this.map,
      clickable: true
    });
  }

  addMarker(lat:any,lng:any) {
      let coordinates = new google.maps.LatLng(lat,lng);
      const marker = new google.maps.Marker({
          position: coordinates,
          map: this.map,
          clickable: true
      });
      return marker
  }

  addCircle(lat:number,lng:number,radius:number){
  }

  addPolygon(latLngArray: [{lat:number,long:number}] | any,color:string){
    let polygon = new google.maps.Polygon({
          paths: latLngArray,
          map: this.map,
          clickable: true
    });
    return polygon;
  }

}
