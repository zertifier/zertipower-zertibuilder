import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CustomersService} from "../../../core/core-services/customers.service";
import {Coordinate} from "mapbox-gl";
import {AppMapComponent} from "../../../shared/infrastructure/components/map/map.component";
import {CommunitiesApiService} from "../../communities/communities.service";
import {EnergyAreasService} from "../../../core/core-services/energy-areas.service";
import * as turf from '@turf/turf'
import { log } from 'console';
import { LocationService } from 'src/app/core/core-services/location.service';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements AfterViewInit {

  customers:any=[];
  communities:any=[];
  locations:any=[];
  selectedCommunity:any;
  selectedCommunities:any;
  selectedLocation:any;
  cadastresMap:any;
  energyAreas:any;
  selectedEnergyArea:any;
  nPlaquesCalc:any;
  kwhMonth:any;
  wp:number = 460; //potencia pico (potencia nominal)

  //chart variables
  monthChartType: string = 'bar';
  monthChartLabels: string[] = [];
  monthChartDatasets: any[] | undefined = undefined;
  monthChartData: any[] = [];
  monthChartBackgroundColor: string [] = [];
  updateMonthChart: boolean = false;
  updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  sumMonthGeneration: number[] = [];
  kwhMonth460wp = [20,25,35,45,55,65,75,75,60,45,35,25]


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
      this.energyAreas = res.data;
      this.energyAreas.map((energyArea:any)=>{
        let geoJsonFeature = energyArea.geojson_feature;
        geoJsonFeature=JSON.parse(geoJsonFeature)
        geoJsonFeature.properties.energyAreaId = energyArea.id;
        geoJson.features.push(geoJsonFeature)
      })
      console.log(geoJson.features[0])
      this.cadastresMap = this.map.addGeoJson(geoJson);

      const clickListener = this.cadastresMap.addListener('click', (event: google.maps.Data.MouseEvent) => {
        // Aquí puedes manejar el evento de clic en la feature
        const feature = event.feature;
        console.log('Clic en la feature:', feature.getProperty('localId'));
        //console.log(feature)
        //console.log(feature.getProperty('energyAreaId'))
        let energyAreaId = feature.getProperty('energyAreaId')

        
        if(this.selectedEnergyArea && this.selectedEnergyArea.id == energyAreaId){ //click unselect
          console.log("unselect energy area")
          this.selectedEnergyArea= null;
          return;
        }

        this.selectedEnergyArea = this.energyAreas.find((energyArea:any)=>
          energyArea.id === energyAreaId
        )
        console.log(`foo = `, this.selectedEnergyArea.m2, this.selectedEnergyArea.m2*0.2,(this.selectedEnergyArea.m2*0.2)/2,Math.floor((this.selectedEnergyArea.m2*0.2)/2))
        this.nPlaquesCalc = Math.floor((this.selectedEnergyArea.m2 * 0.2) / 2)
        console.log(`selected energy area = `, this.selectedEnergyArea)
        console.log("nplaquescalc", this.nPlaquesCalc)
        this.updatekWhPerMonth(this.nPlaquesCalc)

      });
      
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

  multipleSelection(){
    this.map.multipleSelection
  }

  updatekWhPerMonth(panelNumber:number) {

    this.sumMonthGeneration = Array.apply(null, Array(12)).map((element,index)=>{
      let monthGeneration =  this.kwhMonth460wp[index]*panelNumber
      return monthGeneration;
    });

    this.monthChartLabels = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Augost', 'Setembre', 'Octobre', 'Novembre', 'Decembre']
    this.monthChartData = [ this.sumMonthGeneration ]
    this.monthChartDatasets = [
      {
        label: 'Generation (Kwh)',
        data: this.monthChartData[0],
        backgroundColor: 'rgb(54, 162, 235)'
      }
    ]

    this.updateMonthChartSubject.next(true);
  }

}
