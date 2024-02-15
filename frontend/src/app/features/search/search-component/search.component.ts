import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CustomersService} from "../../../core/core-services/customers.service";
import {Coordinate} from "mapbox-gl";
import {AppMapComponent} from "../../../shared/infrastructure/components/map/map.component";
import {CommunitiesApiService} from "../../communities/communities.service";
import {EnergyAreasService} from "../../../core/core-services/energy-areas.service";
import * as turf from '@turf/turf'
import { log } from 'console';
import { LocationService } from 'src/app/core/core-services/location.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

export class SearchComponent implements AfterViewInit {

  customers:any=[];
  communities:any=[];
  locations:any=[];
  selectedCommunity:any;
  selectedCommunities:any;
  selectedLocation:any;

  @ViewChild(AppMapComponent) map!:AppMapComponent ;

  constructor(
    private customersService: CustomersService, 
    private communitiesService: CommunitiesApiService,
    private energyAreasService:EnergyAreasService,
    private locationService:LocationService){}

  async ngAfterViewInit() {

    this.locations = await new Promise((resolve:any,reject:any)=>{
      this.locationService.getLocations().subscribe(async (res:any)=>{
        resolve(res.data)
      },(error:any)=>{
        console.log("error getting locations")
        reject("error")
      })
    })
    
    this.communities =  await new Promise((resolve:any,reject:any)=>{
      this.communitiesService.get().subscribe((res:any)=>{
        resolve(res.data)
      },(error:any)=>{
        console.log("error getting locations")
        reject("error")
      })
    })

    // this.customersService.getCustomersCups().subscribe(async (res: any) => {
    //   console.log("res",res)
    //   this.customers = res.data;
    //   this.customers.map((customer:any)=>{
    //     //console.log("customer",customer)
    //     if(customer.geolocalization){
    //       //this.map.addMarker(customer.geolocalization.y,customer.geolocalization.x)
    //     }
    //   })
    // })

  }

  OnSelectorChange(element: any, attribute: string) {
    switch(attribute){
      case 'location':
        //this.selectedLocation=element;
        this.selectedCommunities = this.communities.map((community:any)=>{
          if(community.location_id==this.selectedLocation.id){
            return community;
          }  
        }) .filter((element: any) => element);
      
        this.renderSelectedCommunities();
        this.renderLocation();
        break;
        default: break;
    }
    
  }

  renderLocation(){
    
    let geoJson:any = {
      "type": "FeatureCollection",
      "features": []
    }

    this.energyAreasService.getByLocation(this.selectedLocation.id).subscribe((res:any)=>{
      let energyAreas = res.data;
      energyAreas.map((energyArea:any)=>{
        let geoJsonFeature = energyArea.geojson_feature;
        geoJsonFeature=JSON.parse(geoJsonFeature)
        geoJsonFeature.properties.color="red";
        geoJsonFeature.properties.strokeColor="red";
        geoJsonFeature.properties.fillColor="red";
        //this.map.addGeoJsonFeatures(geoJsonFeature)
        geoJson.features.push(geoJsonFeature)
      })
      this.map.addGeoJson(geoJson)
      
      // geoJson.features[0]=JSON.parse(geoJson.features[0])
       console.log(geoJson.features[0])
      // geoJson.features[0].properties.color="red";
      // this.map.addGeoJsonFeatures(geoJson.features[0])
    })
    
  }

  renderSelectedCommunities(){
    
    this.map.deleteMarkers();

    console.log("selected communities",this.selectedCommunities)

    this.selectedCommunities.map((community:any)=>{

      console.log("selected",community)
      if(community.lat && community.lng){

        let marker = this.map.addMarker(community.lat,community.lng)
        
        marker.addListener('click',()=>{

          this.selectedCommunity=community;

          /*this.map.addCircle(community.lat,community.lng,200);

          this.energyAreasService.getByArea(community.lat,community.lng,100).subscribe((res:any)=>{
              
              const energyPolygons = this.groupArrayByAttribute(res.data, 'energy_area_id');

              energyPolygons.map(energyPolygon=>{

                let polygon = energyPolygon.map((energyCoords:any)=>{

                  return {lat:parseFloat(energyCoords.lat),lng:parseFloat(energyCoords.lng)};

                })

              polygon = this.orderCoords(polygon);

              this.map.addPolygon(polygon,'red')

            })
          })*/
        })
      }
    })
  }

  groupArrayByAttribute(array:[], attribute:string) {
      const groupedArrays: [][] = [];

      // Creamos un mapa para almacenar los arrays agrupados temporalmente
      const tempMap = new Map<number | string, []>();

      // Iteramos sobre el array para agrupar los elementos según el atributo especificado
      array.forEach(item => {
        const value = item[attribute];
        if (!tempMap.has(value)) {
          tempMap.set(value, []);
        }
        tempMap.get(value)?.push(item);
      });

      // Convertimos el mapa en un array de arrays y lo devolvemos
      tempMap.forEach(value => groupedArrays.push(value));

      return groupedArrays;
    }

  orderCoords(coords:any) {
    let orderedCoords:any = [];
    let simpleCords = coords.map((obj:any) => [obj.lat, obj.lng]);
    // Calcular la envoltura convexa de los puntos
    const convexHull = turf.convex(turf.points(simpleCords));
    // Obtener las coordenadas del polígono convexo
    orderedCoords = convexHull!.geometry.coordinates[0].map(coord => ({ lat: coord[0], lng: coord[1] }));
    return orderedCoords;
  }

  deleteMarkers(){

  }

}
