import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CustomersService } from "../../../core/core-services/customers.service";
import { AppMapComponent } from "../../../shared/infrastructure/components/map/map.component";
import { CommunitiesApiService } from "../../communities/communities.service";
import { EnergyAreasService } from "../../../core/core-services/energy-areas.service";
import * as turf from '@turf/turf'
import { LocationService } from 'src/app/core/core-services/location.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';
import { generateToken } from 'src/app/shared/domain/utils/RandomUtils';
import Swal from 'sweetalert2';
import { TooltipPosition, TooltipTheme } from 'src/app/shared/infrastructure/directives/tooltip/tooltip.enums';


interface cadastre {
  id?:string;
  totalConsumption: number,
  valle: number,
  llano: number,
  punta: number,
  yearConsumption?: number,
  yearGeneration?: number,
  monthsConsumption?: number[],
  monthsGeneration?: number[],
  m2?: number,
  n_plaques?: number,
  inversion?: number,
  savings?: number,
  amortization_years?: number,
  feature?: any
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements OnInit, AfterViewInit {

  customers: any = [];
  communities: any = [];
  locations: any = [];
  selectedCommunity: any;
  newCommunity: any = {};
  selectedCommunities: any;
  selectedLocation: any = { municipality: '' };
  cadastresMap: any;
  energyAreas: any;
  energyArea = { cadastral_reference: '', m2: 0, cups: '' };
  selectedEnergyArea: any;
  kwhMonth: any;
  wp: number = 460; //potencia pico (potencia nominal)

  //chart variables
  monthChartType: string = 'bar';
  monthChartLabels: string[] = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  monthChartClientData: any[] = new Array(12).fill({ p1: 0, p2: 0, p3: 0, production: 0 });;
  monthChartDatasets: any[] | undefined = undefined;
  monthChartData: any[] = [];
  monthChartBackgroundColor: string[] = [];
  updateMonthChart: boolean = false;
  updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  sumMonthGeneration: number[] = [];
  kwhMonth460wp = [20, 25, 35, 45, 55, 65, 75, 75, 60, 45, 35, 25];
  selectedAreaM2: number | undefined;
  paramsSub: any;
  locationId: number | undefined;

  communityValoration: number = 1;
  communityEnergyData: any = [];
  communityMonthChartLabels: any = [];
  communityMonthChartDatasets: any = [];
  communityMonthChartType = 'bar';
  communityUpdateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  communityMonthChartOptions =
    {
      //indexAxis: 'y',
      // Elements options apply to all of the options unless overridden in a dataset
      // In this case, we are setting the border of each horizontal bar to be 2px wide
      elements: {
        bar: {
          borderWidth: 0,
        }
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      }
    }

  cadastreValoration: number = 0;
  selectedCadastreEnergyData: any;
  selectedCadastreMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  selectedCadastreMonthChartDatasets: any = [];
  selectedCadastreMonthChartType = 'bar';
  updateSelectedCadastreMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  selectedCadastreMonthChartOptions =
    {
      //indexAxis: 'y',
      // Elements options apply to all of the options unless overridden in a dataset
      // In this case, we are setting the border of each horizontal bar to be 2px wide
      elements: {
        bar: {
          borderWidth: 0,
        }
      },
      responsive: true,
      mantainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      }
    }

  selectedCadastre: cadastre = {
    totalConsumption: 200,
    valle: 98,
    llano: 52,
    punta: 48
  };

  cupsNumber: number = 0;
  addedAreas: any[] = [];

  TooltipPosition: typeof TooltipPosition = TooltipPosition;
  TooltipTheme: typeof TooltipTheme = TooltipTheme;

  @ViewChild(AppMapComponent) map!: AppMapComponent;

  folder: number = 1;
  isShrunk: boolean = false;

  constructor(
    private communitiesService: CommunitiesApiService,
    private energyAreasService: EnergyAreasService,
    private locationService: LocationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.paramsSub = this.activatedRoute.params.subscribe(
      params => (this.locationId = parseInt(params['id'], 10))
    );
  }

  async ngAfterViewInit() {

    this.locations = await new Promise((resolve: any, reject: any) => {
      this.locationService.getLocations().subscribe(async (res: any) => {
        this.selectedLocation = res.data.find((location: any) => location.id == this.locationId)
        this.map.centerToAddress(`${this.selectedLocation.municipality}, España`)
        resolve(res.data)
      }, (error: any) => {
        console.log("error getting locations")
        Swal.fire('Error de connexió amb el servidor','Intenta-ho mes tard','error')
        reject("error")
      })
    })

    this.communities = await new Promise((resolve: any, reject: any) => {
      this.communitiesService.get().subscribe((res: any) => {
        resolve(res.data)
      }, (error: any) => {
        console.log("error getting locations")
        reject("error")
      })
    })

    this.OnSelectorChange(this.selectedLocation, 'location')

  }

  createLocationControl(locations: any[]) {
    const locationSelector = document.createElement('select');
    locationSelector.classList.add("form-select")
    locationSelector.addEventListener("change", () => { this.OnSelectorChange(locationSelector.value, 'location') })

    for (var i = 0; i < locations.length; i++) {
      var option = document.createElement("option");
      option.value = locations[i];
      option.text = locations[i].municipality;
      locationSelector.appendChild(option);
    }

    const centerControlDiv = document.createElement('div');
    centerControlDiv.classList.add("p-4")
    centerControlDiv.appendChild(locationSelector)


    this.map.addControl(centerControlDiv)
  }

  OnSelectorChange(element: any, attribute: string) {
    switch (attribute) {

      case 'location':

        //this.selectedLocation=element;
        this.selectedCommunities = this.communities.map((community: any) => {
          if (community.location_id == this.selectedLocation.id) {
            return community;
          }
        }).filter((element: any) => element);

        this.renderSelectedCommunities();
        //this.renderLocation();
        break;

      case 'community':
        if (this.selectedCommunity == this.newCommunity) {
          this.communityEnergyData = [];
          this.updateCommunityChart();
        } else {
          this.getCommunityEnergy()
        }
        this.renderLocation()
        break;

      default:
        break;
    }

  }

  getCommunityEnergy(){
    let date = moment().format('YYYY-MM-DD')
    this.communitiesService.getEnergy(this.selectedCommunity.id, date).subscribe((res: any) => {
      this.communityEnergyData = res.data;
      this.updateCommunityChart();
    })
  }


  updateCommunityChart() {

    this.communityMonthChartLabels;
    this.communityMonthChartDatasets = [];
    this.communityMonthChartType = 'bar';

    let imports: number[] = [];
    let exports: number[] = [];

    this.communityEnergyData.forEach((item: any) => {
      this.communityMonthChartLabels.push(item.month);
      //numeros_mes.push(item.month_number);
      imports.push(item.import);
      exports.push(item.export);
    });

    this.addedAreas.map((addedArea: any) => {

      addedArea.monthsConsumption?.map((monthConsumption: number, index: number) => {

        if (imports[index]) {
          imports[index] += monthConsumption;
        }

        if (!imports[index]) {
          imports.push(monthConsumption)
        }

        if (exports[index]) {
          exports[index] += addedArea.monthsGeneration[index];
        }

        if (!exports[index]) {
          exports.push(addedArea.monthsGeneration[index])
        }
      })
    })

    this.communityMonthChartDatasets = [
      {
        label: 'Importació (Kwh)',
        data: imports,
        backgroundColor: 'rgb(211, 84, 0)',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Excedent (Kwh)',
        data: exports,
        backgroundColor: 'rgb(52, 152, 219)',
        borderColor: 'rgb(255,255,255)'
      }
    ]

    this.communityUpdateMonthChartSubject.next(true);

    this.updateCommunityValoration(exports, imports)

  }

  updateCommunityValoration(communityExports: any[], communityImports: any[]) {
    let totalImports: number = 0;
    let totalExports: number = 0;
    communityExports.map((communityExport: any, index: number) => {
      totalExports += communityExport;
    })
    communityImports.map((communityImport: any, index: number) => {
      totalImports += communityImport;
    })
    if (totalImports > totalExports) {
      this.communityValoration = 3
    } else {
      this.communityValoration = 1
    }
  }

  renderLocation() {

    console.log("render location")

    let geoJson: any = {
      "type": "FeatureCollection",
      "features": []
    }

    this.energyAreasService.getByLocation(this.selectedLocation.id).subscribe((res: any) => {

      this.energyAreas = res.data;

      this.energyAreas.map((energyArea: any) => {
        let geoJsonFeature = energyArea.geojson_feature;
        geoJsonFeature = JSON.parse(geoJsonFeature)
        geoJsonFeature.properties.energyAreaId = energyArea.id;
        geoJson.features.push(geoJsonFeature)
      })

      this.cadastresMap = this.map.addGeoJson(geoJson);

      const clickListener = this.cadastresMap.addListener('click', (event: google.maps.Data.MouseEvent) => {

        this.resetCadastre();

        const feature = event.feature;
        
        //if selected is false, the click was to deselect
        let isSelectedArea = feature.getProperty('selected')
        if(!isSelectedArea){
          return;
        }

        let cadastre:any = feature.getProperty('localId')

        //check if selected area is an already added area
        let foundArea = this.addedAreas.find((addedArea)=>addedArea.id==cadastre)
        if(foundArea){
          this.selectedCadastre = foundArea;
          this.updateCadastreChart();
          this.updateSelectedCadastreValoration();
          return;
        }

        this.selectedCadastre.feature = feature;
        this.selectedCadastre.id = cadastre;

        let areaM2: any = feature.getProperty('areaM2');
        this.selectedCadastre.m2 = Math.floor(areaM2);
        this.selectedCadastre.n_plaques = Math.floor((this.selectedCadastre.m2! * 0.2) / 1.7) | 0;

        this.updateCadastreConsumptionM2();
        this.updateCadastreChart();
        this.updateSelectedCadastreValoration();

      });

    })

  }

  renderSelectedCommunities() {

    this.map.deleteMarkers();

    this.selectedCommunities.map((community: any) => {

      if (community.lat && community.lng) {

        let marker = this.map.addMarker(community.lat, community.lng)

        marker.addListener('click', () => {
          this.selectedCommunity = community;
          this.getCommunityEnergy();
          this.renderLocation()
        })

      }

    })
  }

  redirectBack() {
    this.router.navigate(['/select-location']);
  }

  groupArrayByAttribute(array: [], attribute: string) {
    const groupedArrays: [][] = [];
    // Creamos un mapa para almacenar los arrays agrupados temporalmente
    const tempMap: any = new Map<number | string, []>();
    // Iteramos sobre el array para agrupar los elementos según el atributo especificado
    array.forEach((item: { [x: string]: any; }) => {
      const value = item[attribute];
      if (!tempMap.has(value)) {
        tempMap.set(value, []);
      }
      tempMap.get(value)?.push(item);
    });
    // Convertimos el mapa en un array de arrays y lo devolvemos
    tempMap.forEach((value: any) => groupedArrays.push(value));

    return groupedArrays;
  }

  orderCoords(coords: any) {
    let orderedCoords: any = [];
    let simpleCords = coords.map((obj: any) => [obj.lat, obj.lng]);
    // Calcular la envoltura convexa de los puntos
    const convexHull = turf.convex(turf.points(simpleCords));
    // Obtener las coordenadas del polígono convexo
    orderedCoords = convexHull!.geometry.coordinates[0].map(coord => ({ lat: coord[0], lng: coord[1] }));
    return orderedCoords;
  }
  deleteMarkers() {
  }

  multipleSelection() {
    if (this.map.multipleSelection) {
      this.map.multipleSelection = false;
      this.map.unselect();
    } else {
      this.map.multipleSelection = true;
    }
  }

  updateCadastreConsumptionM2() {
    //TODO: update algorythm
    let updatedConsumption = this.selectedCadastre.totalConsumption + this.selectedCadastre.m2!
    this.selectedCadastre.totalConsumption = updatedConsumption;
    this.selectedCadastre.valle = this.selectedCadastre.totalConsumption * 0.50;
    this.selectedCadastre.llano = this.selectedCadastre.totalConsumption * 0.26;
    this.selectedCadastre.punta = this.selectedCadastre.totalConsumption * 0.24;
  }

  updateCadastreConsumption() {
    
    this.selectedCadastre.valle = Math.abs(this.selectedCadastre.valle)
    this.selectedCadastre.llano = Math.abs(this.selectedCadastre.llano)
    this.selectedCadastre.punta = Math.abs(this.selectedCadastre.punta)

    this.selectedCadastre.totalConsumption = this.selectedCadastre.valle + this.selectedCadastre.llano + this.selectedCadastre.punta
    this.updateCadastreChart();
  }

  featureSelected(selectedFeature: any) {
      
  }

  updateSelectedCadastreValoration() {
    let consumption = this.selectedCadastre.yearConsumption!;
    let production = this.selectedCadastre.yearGeneration!;
    if (consumption > production) {
      this.cadastreValoration = 3;
    } else if (production > consumption) {
      this.cadastreValoration = 1;
    } else {
      this.cadastreValoration = 2;
    }

  }

  updateCadastreChart() {

    this.cdr.detectChanges();

    let monthConsumption = this.selectedCadastre.totalConsumption;
    this.selectedCadastre.n_plaques=Math.abs( this.selectedCadastre.n_plaques || 0)
    let monthConsumptionArray: any = [];
    let sumMonthGeneration: number = 0;
    let sumMonthConsumption: number = 0;

    let monthGenerationArray = Array.apply(null, Array(12)).map((element, index) => {
      let monthGeneration = this.kwhMonth460wp[index] * this.selectedCadastre.n_plaques!;
      monthConsumptionArray.push(monthConsumption);
      sumMonthGeneration += monthGeneration;
      sumMonthConsumption += monthConsumption;
      return monthGeneration;
    });

    this.selectedCadastre.yearConsumption = sumMonthConsumption;
    this.selectedCadastre.yearGeneration = sumMonthGeneration;
    this.selectedCadastre.monthsConsumption = monthConsumptionArray;
    this.selectedCadastre.monthsGeneration = monthGenerationArray;

    this.selectedCadastreMonthChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: monthConsumptionArray,
        backgroundColor: 'rgb(211, 84, 0)',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Generació',
        data: monthGenerationArray,
        backgroundColor: 'rgb(52, 152, 219)',
        borderColor: 'rgb(255,255,255)'
      }
    ]

    this.updateSelectedCadastreMonthChartSubject.next(true);

    this.updateSelectedCadastreValoration()

  }

  changeShrinkState() {
    this.isShrunk = !this.isShrunk;
  }

  resetCadastre() {
    this.selectedCadastre = {
      totalConsumption: 200,
      valle: 98,
      llano: 52,
      punta: 48
    }
  }

  addArea() {
    console.log("added areas 1",this.addedAreas)
    let found = this.addedAreas.find((addedArea: any) => addedArea.id == this.selectedCadastre.id)
    if (found) {
      console.log("update area")
      this.addedAreas = [...this.addedAreas]
    } else {
      console.log("add area")
      this.addedAreas = this.addedAreas.concat([this.selectedCadastre])
      this.updateCommunityChart()
      this.map.activeArea(this.selectedCadastre)
    }
    console.log("added areas 2",this.addedAreas)
    this.resetCadastre();
  }

  deleteArea(index: number) {
    this.map.deleteArea(this.addedAreas[index])
    this.addedAreas.splice(index, 1);
    this.resetCadastre();
    console.log(this.addedAreas)
  }

  unselectArea(feature:any){
    this.map.unselectArea(feature)
    this.resetCadastre();
  }

  editArea(index: number) {
    console.log("edit area",this.addedAreas[index]);
    this.map.selectArea(this.addedAreas[index])
    this.selectedCadastre = this.addedAreas[index];
  }

}

//TODO:  he agregado id para identificar de manera más segura las areas
