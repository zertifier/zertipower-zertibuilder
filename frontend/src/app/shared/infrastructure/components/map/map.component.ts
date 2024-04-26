import {
  AfterViewInit,
  ChangeDetectorRef,
  Component, ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnInit, SimpleChanges, ViewChild,
} from "@angular/core";
import {GoogleMap} from '@angular/google-maps';
import {Output, EventEmitter} from '@angular/core';
import {log} from "console";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {listenerCount} from "process";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styles: `

    #map {
      object-fit: cover;
      width: 100%;
      max-height: 100%;
      border-radius: 6px;
      height: 85vh;
      min-height: 323.4px;
    }

    .custom-marker {
      background: url("/assets/marker-blue.png");
    }

    .custom-marker {
      max-width: 50px;
    }

    /* mapa.component.css */
    #mapContainer {
      height: 400px;
      width: 100%;
    }

  `
})

export class AppMapComponent implements AfterViewInit, OnChanges {

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
  @Input() activeFeatures: any;
  @Input() address: string = '';

  polygonT = [{lat: this.lat, lng: this.lng}, {lat: this.lat + 0.001, lng: this.lng + 0.001}]

  mapOptions: google.maps.MapOptions = {
    center: this.coordinates,
    zoom: 8,
    mapTypeId: 'satellite',
    mapId: '4ad7272795cc4f73',
    zoomControl: this.zoomControl,
    mapTypeControl: this.mapTypeControl,
    scaleControl: this.scaleControl,
    streetViewControl: this.streetViewControl,
    rotateControl: this.rotateControl,
    fullscreenControl: this.fullscreenControl
  };

  markers: google.maps.Marker[] = [];
  selectedMarker: google.maps.Marker | undefined;

  previousFeature: any = null;

  infoWindow: google.maps.InfoWindow | null = null;
  originalStyle: any = {
    fillColor: "red",
    fillOpacity: 0.0,
    strokeColor: "white",
    strokeWeight: 1.0,
    strokeDashArray: '10000, 10000'
  }
  activeStyle: any = {
    fillColor: "blue",
    fillOpacity: 0.5,
    strokeColor: "blue",
    strokeWeight: 1.0,
    strokeDashArray: '10000, 10000'
  }
  selectedStyle: any = {fillColor: 'white', fillOpacity: 0.5, strokeColor: 'white'}
  multipleSelection = false;

  markerColor = '#959150'
  selectedMarkerColor = '#0e2b4c'

  @Output() selectedFeature = new EventEmitter<any>();

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private ref: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    this.mapInitializer();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'update':
            /*if (changes['update'].currentValue) {
              console.log(changes['update'].currentValue)
              this.updateChart();
            } else {
              console.log(changes['update'].currentValue)
            }*/
            break;
          case 'activeFeatures':
            this.updateActiveFeatures(changes['activeFeatures'].currentValue)
            break;
          default:
            break;
        }
      }
    }
  }

  mapInitializer() {

    this.ngZone.run(() => {
      this.map = new google.maps.Map(this.gmap.nativeElement, this.mapOptions);
    })

    this.map.data.setStyle(this.originalStyle)

    this.map.data.addListener('click', (event: any) => {

      this.setFeatureArea(event.feature)

      //si el area está seleccionada y no está activa (deseleccionar)
      if (event.feature.getProperty('selected') && !event.feature.getProperty('active')) {
        event.feature.setProperty('selected', false);
        this.map.data.overrideStyle(event.feature, this.originalStyle);
        this.selectedFeature.emit({selected: false, feature: event.feature});
      }

      //si el area está seleccionada y está activa (deseleccionar)
      else if (event.feature.getProperty('selected') && event.feature.getProperty('active')) {
        event.feature.setProperty('selected', false);
        this.map.data.overrideStyle(event.feature, this.activeStyle);
        this.selectedFeature.emit({selected: false, feature: event.feature});
      }

      //si el area no está seleccionada (posiblemente seleccionar)
      else if (!event.feature.getProperty('selected')) {

        //si la multiple seleccion no está activada, deseleccionar anterior selección
        if (!this.multipleSelection && this.previousFeature && !this.previousFeature.getProperty('active')) {
          this.previousFeature.setProperty('selected', false);
          this.map.data.overrideStyle(this.previousFeature, this.originalStyle);
        }

        //si la selección anterior está activa
        if (this.previousFeature && this.previousFeature.getProperty('selected') && this.previousFeature.getProperty('active')) {
          this.previousFeature.setProperty('selected', false);
          this.map.data.overrideStyle(this.previousFeature, this.activeStyle);
        }

        //seleccionar
        event.feature.setProperty('selected', true);
        this.map.data.overrideStyle(event.feature, this.selectedStyle);
        this.selectedFeature.emit({selected: true, feature: event.feature});
      }
      this.ref.detectChanges()
      this.previousFeature = event.feature;

    });

  }

  addMarker(lat: any, lng: any) {

    console.log("add marker")

    let coordinates = new google.maps.LatLng(lat, lng);

    const marker = new google.maps.Marker({
      position: coordinates,
      map: this.map,
      clickable: true,
      icon: {
        path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
        fillColor: this.markerColor,
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

  selectMarker(lat: any, lng: any) {
    if (this.selectedMarker) { //deselect the previous marker
      this.selectedMarker.setIcon({
        path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
        fillColor: this.markerColor,
        fillOpacity: 1,
        strokeWeight: 0,
        rotation: 0,
        scale: 0.1,
        anchor: new google.maps.Point(200, 550),
      })
    }
    this.selectedMarker = this.markers.find(marker => marker.getPosition()?.lat() == lat && marker.getPosition()?.lng() == lng)
    if (this.selectedMarker) {
      this.selectedMarker.setIcon({
        path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
        fillColor: this.selectedMarkerColor,
        fillOpacity: 1,
        strokeWeight: 0,
        rotation: 0,
        scale: 0.1,
        anchor: new google.maps.Point(200, 550),
      })
    }
  }

  unselectMarker(lat: any, lng: any) {
    let selectedMarker = this.markers.find(marker => marker.getPosition()?.lat() == lat && marker.getPosition()?.lng() == lng)
    if (selectedMarker) {
      selectedMarker.setIcon({
        path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
        fillColor: this.markerColor,
        fillOpacity: 1,
        strokeWeight: 0,
        rotation: 0,
        scale: 0.1,
        anchor: new google.maps.Point(200, 550),
      })
    }
  }

  deleteMarkers() {
    this.markers.map(marker => {
      marker.setMap(null)
    })
    this.markers = [];
  }

  addCircle(lat: number, lng: number, radius: number) {

    const cityCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.15,
      map: this.map,
      center: {lat: lat, lng: lng},
      radius: radius,
    });

    return cityCircle;
  }

  addPolygon(latLngArray: [{ lat: number, lng: number }] | any, color: string) {
    let polygon = new google.maps.Polygon({
      paths: latLngArray,
      map: this.map,
      clickable: true
    });
    return polygon;
  }

  addGeoJsonFeatures(geojsonFeatures: any) {
    let jsonData = {
      "type": "FeatureCollection",
      "features": geojsonFeatures
    }
    this.map.data.addGeoJson(jsonData);
  }

  async addGeoJson(geoJson: any) {
    let geoJsonMap = await this.map.data.addGeoJson(geoJson);
    return this.map.data;
  }

  setMapStyle(fillColor: string, fillOpacity: number, strokeColor: string, strokeOpacity: number) {
    this.map.data.setStyle({fillColor, fillOpacity, strokeColor, strokeOpacity})
  }

  updateActiveFeatures(activeFeatures: any) {
    console.log("updateActiveFeatures")

    // this.map.data.forEach((listedFeature) => {
    //   this.activeFeatures.find((activeFeature: any) => activeFeature.feature = listedFeature)
    // })

    this.activeFeatures.map((activeFeature: any) => {
      this.activeArea(activeFeature)
    })
  }

  deleteArea(feature: any) {
    console.log("feature", feature)

    //delete feature from active features by id
    this.activeFeatures = this.activeFeatures.filter((objeto: any) => objeto.id !== feature.id);

    this.map.data.forEach((listedFeature) => {
      if (feature.id == listedFeature.getProperty('localId')) {
        console.log("ENCONTRADA", listedFeature)
        listedFeature.setProperty('active', false);
        listedFeature.setProperty('selected', false);
        this.map.data.overrideStyle(listedFeature, this.originalStyle);
      }
    })

    console.log("active features", this.activeFeatures)

  }

  selectArea(feature: any) {
    //console.log(feature)
    //let featureFound = this.activeFeatures.find((activeFeature:any)=>activeFeature.id==feature.id);
    //if(featureFound){
    this.map.data.forEach((listedFeature) => {
      if (listedFeature.getProperty('localId') == feature.id) {
        listedFeature.setProperty('selected', true);
        this.map.data.overrideStyle(listedFeature, this.selectedStyle);
      }
    })
  }

  unselectArea(feature: any) {
    this.map.data.forEach((listedFeature) => {
      if (listedFeature.getProperty('localId') == feature.id) {
        listedFeature.setProperty('selected', false);
        if (listedFeature.getProperty('active')) {
          this.map.data.overrideStyle(listedFeature, this.activeStyle);
        } else {
          this.map.data.overrideStyle(listedFeature, this.originalStyle);
        }
      }
    })
  }

  unselect() {
    console.log("unselect")
    this.map.data.forEach((feature) => {
      console.log(feature)
      this.map.data.overrideStyle(feature, this.originalStyle);
      feature.setProperty('selected', false);
    })
  }

  activeArea(featureData: any) {
    this.map.data.forEach((feature) => {
      if (feature == featureData.feature) {
        console.log("activate feature", feature)
        feature.setProperty('active', true);
        feature.setProperty('selected', false);
        this.map.data.overrideStyle(feature, this.activeStyle);
        this.selectedFeature.emit({selected: false, feature: feature});
      }
    })
  }

  setFeatureArea(feature: any) {
    let geometry = feature.getGeometry().getArray()

    for (var i = 0; i < geometry.length; i++) {

      console.log(geometry[i].getType())

      // Verificar si la geometría es un polígono
      if (geometry[i].getType() === 'Polygon') {

        // Obtener los puntos del polígono
        const coordinates = geometry[i].getArray()[0].getArray();

        // Convertir las coordenadas a objetos google.maps.LatLng
        const path = coordinates.map((coordinate: any) => {
          return {lat: coordinate.lat(), lng: coordinate.lng()};
        });

        // Calcular el área del polígono
        const areaM2 = google.maps.geometry.spherical.computeArea(path);

        feature.setProperty('areaM2', areaM2);

      } else {
        console.log('La geometría no es un polígono.');
      }
    }
  }

  addControl(control: any, position: string = 'top-left') {
    switch (position) {
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

  centerToAddress(address: string) {
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
      geocoder.geocode({'address': address}, (results, status) => {
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
