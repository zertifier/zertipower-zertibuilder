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
  polygonT = [{lat:this.lat,lng:this.lng},{lat:this.lat+0.001,lng:this.lng+0.001}]

  coordinates = new google.maps.LatLng(this.lat, this.lng);
  mapOptions: google.maps.MapOptions = {
    center: this.coordinates,
    zoom: 8,
    mapTypeId:'satellite'
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.mapInitializer();
  }

  mapInitializer() {
    this.map = new google.maps.Map(this.gmap.nativeElement, this.mapOptions);

    //this.map.data.loadGeoJson('../assets/datos_olot_transformados.geojson');
    
    // const marker = new google.maps.Marker({
    //   position: this.coordinates,
    //   map: this.map,
    //   clickable: true
    // });
    // const polygon = new google.maps.Polygon({
    //   paths: this.polygonT,
    //   map: this.map,
    //   clickable: true
    // });
    //this.addPolygon(this.polygonT,'red')
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
    console.log("CIRCLE")
    const cityCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.15,
      map:this.map,
      center:{lat:lat,lng:lng},
      radius: radius,
    });
    console.log("CIRCULO",cityCircle)
    return cityCircle;
  }

  addPolygon(latLngArray: [{lat:number,lng:number}] | any,color:string){
    let polygon = new google.maps.Polygon({
          paths: latLngArray,
          map: this.map,
          clickable: true
    });
    return polygon;
  }

  addGeoJsonFeatures(geojsonFeatures:any){
    let jsonData = {
      "type": "FeatureCollection",
      "features": geojsonFeatures
    }
    this.map.data.loadGeoJson(JSON.stringify(jsonData));
  }

}
