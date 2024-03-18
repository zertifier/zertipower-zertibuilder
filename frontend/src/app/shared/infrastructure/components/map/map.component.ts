import {
  AfterViewInit,
  ChangeDetectorRef,
  Component, ElementRef,
  Input,
  NgZone,
  OnInit, ViewChild,
} from "@angular/core";
import {GoogleMap} from '@angular/google-maps';
import { Output, EventEmitter } from '@angular/core';
import { log } from "console";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

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
  //catalonia coordinates
  coordinates = new google.maps.LatLng(this.lat, this.lng);

  @Input() zoomControl: boolean = false;
  @Input() mapTypeControl: boolean = false;
  @Input() scaleControl: boolean = false;
  @Input() streetViewControl: boolean = false;
  @Input() rotateControl: boolean = false;
  @Input() fullscreenControl: boolean = false;

  @Input() address: string = ''; 

  polygonT = [{lat:this.lat,lng:this.lng},{lat:this.lat+0.001,lng:this.lng+0.001}]
  
  mapOptions: google.maps.MapOptions = {
    center: this.coordinates,
    zoom: 8,
    mapTypeId:'satellite',
    mapId: '4ad7272795cc4f73',
    zoomControl:this.zoomControl,
    mapTypeControl:this.mapTypeControl,
    scaleControl:this.scaleControl,
    streetViewControl:this.streetViewControl,
    rotateControl:this.rotateControl,
    fullscreenControl:this.fullscreenControl
  };

  markers: google.maps.Marker[] = [];

  previousFeature: any = null;

  infoWindow: google.maps.InfoWindow | null = null;
  originalStyle: any = {fillColor:"red",fillOpacity:0.0,strokeColor:"white",strokeWeight:1.0,strokeDashArray: '10000, 10000'}
  multipleSelection = false;

  @Output() selectedAreaM2 = new EventEmitter<number>();
  @Output() selectedFeature = new EventEmitter<any>();


  constructor(private cdr: ChangeDetectorRef, private ngZone:NgZone) {}

  ngAfterViewInit() {
    this.mapInitializer();
  }

  mapInitializer() {

    this.ngZone.run(()=>{
      this.map = new google.maps.Map(this.gmap.nativeElement, this.mapOptions);
    })
    
    this.map.data.setStyle(this.originalStyle)

    this.map.data.addListener('click', (event:any) => {

      if (event.feature.getProperty('selected')) {
        console.log("unselect")
        event.feature.setProperty('selected',false);
        this.map.data.overrideStyle(event.feature,this.originalStyle); 
        this.selectedFeature.emit({selected:false,feature:event.feature});
      }else{
        console.log("select")
        if(!this.multipleSelection && this.previousFeature){
          this.previousFeature.setProperty('selected',false);
          this.map.data.overrideStyle(this.previousFeature,this.originalStyle); 
        }
        event.feature.setProperty('selected',true);
        this.map.data.overrideStyle(event.feature, { fillColor: 'white', fillOpacity: 0.5, strokeColor: 'white' });
        this.emitFetureArea(event.feature)
        this.selectedFeature.emit({selected:true,feature:event.feature});
      }
      
      this.previousFeature=event.feature;

   });

  }

  addMarker(lat:any,lng:any) {

    console.log("add marker")

      let coordinates = new google.maps.LatLng(lat,lng);
      
      const marker = new google.maps.Marker({
          position: coordinates,
          map: this.map,
          clickable: true,
          icon: {
            path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
            fillColor: "blue",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 0.1,
            anchor: new google.maps.Point(200, 550),
          }
      });
      this.markers.push(marker)
      return marker
  }

  deleteMarkers(){
      this.markers = [];
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
    this.map.data.addGeoJson(jsonData);
  }

  addGeoJson(geoJson:any){
    let geoJsonMap = this.map.data.addGeoJson(geoJson);
    return this.map.data;
  }

  setMapStyle(fillColor:string,fillOpacity:number,strokeColor:string,strokeOpacity:number){
    this.map.data.setStyle({fillColor,fillOpacity,strokeColor,strokeOpacity})
  }

  unselect(){
    console.log("unselect")
    this.map.data.forEach((feature)=>{
      console.log(feature)
      this.map.data.overrideStyle(feature,this.originalStyle); 
      feature.setProperty('selected',false);
    })
  }

  emitFetureArea(feature:any){

    let geometry = feature.getGeometry().getArray()

    for (var i = 0; i < geometry.length; i++) {
      
      console.log(geometry[i].getType())

      // Verificar si la geometría es un polígono
      if (geometry[i].getType() === 'Polygon') {
        
        // Obtener los puntos del polígono
        const coordinates = geometry[i].getArray()[0].getArray();

        // Convertir las coordenadas a objetos google.maps.LatLng
        const path = coordinates.map((coordinate:any) => {
            return { lat: coordinate.lat(), lng: coordinate.lng() };
        });

        // Calcular el área del polígono
        const areaM2 = google.maps.geometry.spherical.computeArea(path);

        console.log('Área del polígono en metros cuadrados:', areaM2);
        this.selectedAreaM2.emit(areaM2);

      } else {
          console.log('La geometría no es un polígono.');
      }
    }
  }

  addControl(control:any, position:string = 'top-left'){
    switch(position){
      case 'top-center':
        this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
        break;
      case 'top-right':
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(control);
        break;
      case 'top-left':   
      this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(control);
      break;
      default:
        break;
    }
    
  }

  centerToAddress(address:string){
    this.geocodeAddress(address).then((coordinates: google.maps.LatLng | null) => {
      if (coordinates) {
        this.map.setCenter(coordinates);
        this.map.setZoom(14)
      } else {
        console.error('No se pudo encontrar las coordenadas para la dirección proporcionada:', address);
      }
    }).catch(error => {
      console.error('Error al geocodificar la dirección:', error, address);
    });
  }

  geocodeAddress(address: string): Promise<google.maps.LatLng | null> {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ 'address': address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          const location = results![0].geometry.location;
          const coordinates = new google.maps.LatLng(location.lat(), location.lng());
          resolve(coordinates);
        } else {
          reject(status);
        }
      });
    });
  }

}
