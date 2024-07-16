import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as turf from '@turf/turf'
import { BehaviorSubject, forkJoin, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import { TooltipPosition, TooltipTheme } from '../../directives/tooltip/tooltip.enums';
import { AppMapComponent } from '../../components/map/map.component';
import { CommunitiesApiService } from '../../services/communities.service';
import { EnergyAreasService } from '../../services/energy-areas.service';
import { EnergyBlocksApiService } from '../../services/energy-blocks.service';
import { LocationService } from '../../services/location.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ChartModalComponent } from '../../components/chart-modal/chart-modal.component';

interface cadastre {
  id?: string;
  totalConsumption: number,
  valle: number,
  llano: number,
  punta: number,
  vallePrice: number,
  llanoPrice: number,
  puntaPrice: number,
  valleMonthlyCost?: number,
  llanoMonthlyCost?: number,
  puntaMonthlyCost?: number,
  monthlyConsumptionCost?: number,
  generationPrice?: number,
  surplusMonthlyProfits?: number,
  redeemYears?: number,
  totalConsumptionPrice?: number,
  yearConsumption?: number,
  yearGeneration?: number,
  monthsConsumption?: number[],
  monthsGeneration?: number[],
  monthsSurplus?: number[],
  m2?: number,
  oldM2?: number,
  n_plaques?: number,
  inversion?: number,
  savings?: number,
  amortization_years?: number,
  feature?: any
  totalCost?: number,
  monthlySavings?: number,
  InsalledPower?: number,
  orientation?: number,
  oldOrientation?: number,
  inclination?: number,
  oldInclination?: number,
  selfConsumption: selfConsumption
}

interface selfConsumption {
  monthlySavings?: number,
  redeemYears?: number,
  surplusMonthlyProfits?: number,
  communityMonthlyCosts?: number
}

@Component({
  selector: 'app-calculate',
  templateUrl: './calculate.component.html',
  styleUrl: './calculate.component.scss'
})
export class CalculateComponent implements OnInit, AfterViewInit {

  stepActive: number = 1;
  stepsCompleted: number[] = [0, 0, 0, 0, 0, 0];
  steps: string[] = ['Seleccionar una població', 'Seleccionar una comunitat', 'Dades i estadístiques de la comunitat',
    'Seleccionar Àrea', `Calcular generació de l'àrea seleccionada`, 'Afegir comunitat']

  locations: any = [];
  selectedLocation: any = { id: 0, municipality: '', province: '' };
  selectedLocationId: number | undefined;

  communities: any = [];
  selectedCommunity: any = null;
  selectedCommunities: any;
  newCommunity: any = {};
  communityCups: any = [];

  cadastresMap: any;
  energyAreas: any;
  //energyArea = { cadastral_reference: '', m2: 0, cups: '' };
  //selectedEnergyArea: any;
  //kwhMonth: any;
  //wp: number = 460; //potencia pico (potencia nominal)

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
  //kwhMonth460wp = [20, 25, 35, 45, 55, 65, 75, 75, 60, 45, 35, 25];
  //selectedAreaM2: number | undefined;
  //paramsSub: any;

  orientations: any[] = [
    { name: 'Sud', value: 0 },
    //{ name: 'Sudest', value: 30 },
    //{ name: 'Sudoest', value: 30 },
    { name: 'Est', value: 90 },
    { name: 'Oest', value: 90 }
  ];
  inclinations: any[] = [
    { name: '0-5%', value: 2 },
    { name: '10-15%', value: 13 },
    { name: '20-30%', value: 25 },
    { name: '30-40%', value: 35 }
  ];
  communityValoration: number = 0;
  communityEnergyData: any = [];
  communityMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  communityMonthChartDatasets: any = [];
  communityMonthChartType = 'bar';
  communityUpdateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  communityMonthChartOptions: any =
    {
      interaction: {
        intersect: false,
        mode: 'index',
      },
      // indexAxis: this.isMobile ? 'y' : 'x',
      indexAxis: 'x',
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
            pointStyle: 'circle',
            color: '#0E2B4C'
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#0E2B4C'
          }
        },
        x: {
          ticks: {
            color: '#0E2B4C'
          }
        }
      }
    }

  cadastreValoration: number = 0;
  selectedCadastreEnergyData: any;
  selectedCadastreMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  selectedCadastreMonthChartDatasets: any = [];
  selectedCadastreGenerationMonthChartDatasets: any = [];
  selectedCadastreMonthChartType = 'bar';
  updateSelectedCadastreMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  selectedCadastreMonthChartOptions: any =
    {
      interaction: {
        intersect: false,
        mode: 'index',
      },
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
    punta: 48,
    vallePrice: 0.10,
    llanoPrice: 0.13,
    puntaPrice: 0.19,
    generationPrice: 0.10,
    orientation: 0,
    inclination: 25,
    selfConsumption: {}
  };

  selectedCadastreBackup: cadastre = {
    totalConsumption: 0,
    valle: 0,
    llano: 0,
    punta: 0,
    vallePrice: 0,
    llanoPrice: 0,
    puntaPrice: 0,
    generationPrice: 0,
    orientation: 0,
    inclination: 0,
    selfConsumption: {}
  };

  cupsNumber: number = 0;
  addedAreas: any[] = [];

  //TooltipPosition: typeof TooltipPosition = TooltipPosition;
  //TooltipTheme: typeof TooltipTheme = TooltipTheme;

  @ViewChild(AppMapComponent) map!: AppMapComponent;

  //folder: number = 1;
  //isShrunk: boolean = false;

  loading: Subject<boolean> = new Subject<boolean>;
  isSpinning: boolean = false;

  //engineeringCost: number = 1623;
  //installationCost: number[] = [0.35, 0.3, 0.24];
  //invertersCost: number[] = [0.105, 0.087, 0.072];
  //managementCost: number[] = [1500, 1500, 2000];
  //panelsCost: number = 0.265;
  //structureCost: number = 0.07;
  selectedCoords: any;

  activeSimulation: boolean = false;
  //activeIndividual: boolean = false;
  //activeCommunity: boolean = false;
  //activeAcc: boolean = false;
  //activeCce: boolean = false;
  
  editingArea = false;
  isMobile = false;

  constructor(
    private communitiesService: CommunitiesApiService,
    private energyAreasService: EnergyAreasService,
    private energyBlocksService: EnergyBlocksApiService,
    private locationService: LocationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {

    this.locationService.getLocations().subscribe(async (res: any) => {
      this.locations = res.data;
    }, (error: any) => {
      console.log("error getting locations: ", error)
    })

    try {
      this.selectedLocationId = parseInt(localStorage.getItem("location")!)
      if (this.selectedLocationId) {
        this.stepActive = 2;
        //this.stepsCompleted[0] = 1;
        this.updateCompleteSteps(0);
      }
    } catch {
      console.log("location unselected")
    }

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.customizeChartSize(window.innerWidth);
  }

  setMobileStatus(sizePx: number) {
    return sizePx < 768;
  }

  customizeChartSize(windowWidth: number) {
    if (this.setMobileStatus(window.innerWidth) != this.isMobile) {
      this.isMobile = this.setMobileStatus(windowWidth)
      this.communityMonthChartOptions.indexAxis = this.isMobile ? 'y' : 'x';
      this.communityMonthChartOptions.aspectRatio = this.isMobile ? 1 : 1.5;
      this.selectedCadastreMonthChartOptions.indexAxis = this.isMobile ? 'y' : 'x';
      this.selectedCadastreMonthChartOptions.aspectRatio = this.isMobile ? 1 : 1.5;
      this.communityUpdateMonthChartSubject.next(true)
    }
  }

  async ngOnInit() {
    if (this.setMobileStatus(window.innerWidth) != this.isMobile) {
      this.customizeChartSize(window.innerWidth);
    }
  }

  async ngAfterViewInit() {

    this.locations = await new Promise((resolve: any, reject: any) => {
      this.locationService.getLocations().subscribe(async (res: any) => {
        this.selectedLocation = res.data.find((location: any) => location.id == this.selectedLocationId)
        //console.log("selected location",this.selectedLocation,this.selectedLocationId)
        if (this.selectedLocation) {
          this.map.centerToAddress(`${this.selectedLocation.municipality}, España`)
        } else {
          console.log("Selected location not found")
        }
        resolve(res.data)
      }, (error: any) => {
        console.log("error getting locations")
        Swal.fire('Error de connexió amb el servidor', 'Intenta-ho mes tard', 'error')
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
    //this.createLocationControl(this.locations)

  }

  resetSteps() {
    this.stepsCompleted = [0, 0, 0, 0, 0, 0];
  }

  updateCompleteSteps(stepCompleted: number) {
    for (let i = 0; i < this.stepsCompleted.length; i++) {
      if (i <= stepCompleted) {
        this.stepsCompleted[i] = 1;
      } else {
        this.stepsCompleted[i] = 0;
      }
    }
  }

  changeStep(stepDestination: number) {

    //console.log("changeStep", stepDestination)
    //todo: no puede haber un tick más avanzado que stepActive. ¿?
    // for(let i = this.stepsCompleted.length;i>=this.stepActive;i--){
    //   this.stepsCompleted[i]=0;
    // }

    if (stepDestination == 2 && !this.selectedLocation) {
      Swal.fire({ text: 'Selecciona una localitat per avançar al següent pas.', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>', customClass: { confirmButton: 'btn btn-secondary', icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      return;
    }

    if ((stepDestination == 3 || stepDestination == 4) && !this.selectedCommunity) {
      Swal.fire({ text: `Selecciona una comunitat \n per avançar al següent pas.`, iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>', customClass: { confirmButton: 'btn btn-secondary', icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      return;
    }

    if (stepDestination == 5 && !this.selectedCadastre.m2 && this.stepActive < 6) {
      Swal.fire({ text: 'Selecciona un àrea per avançar al següent pas.', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>', customClass: { confirmButton: 'btn btn-secondary', icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      return;
    }

    if (stepDestination == 6 && !this.selectedCadastre.m2) {
      Swal.fire({ text: 'Selecciona un àrea per avançar al següent pas.', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>', customClass: { confirmButton: 'btn btn-secondary', icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      return;
    }

    if (stepDestination == 3) {
      this.stepsCompleted[2] = 1;
    }
    if (stepDestination == 4) {
      //this.stepsCompleted[3]=1;
    }

    if (stepDestination == 5) {
      this.stepsCompleted[4] = 1;
    }

    this.stepActive = stepDestination;

    this.scrollToElement(`collapser-${stepDestination}`)

    this.cdr.detectChanges();
  }

  scrollToElement(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getStepClasses(stepActive: number) {
    if (this.stepActive === stepActive) {
      return 'd-flex w-100 py-2 px-4 border-primary text-light bg-primary rounded-top';
    } else if (this.stepsCompleted[stepActive - 1]) {
      return 'card d-flex w-100 py-2 px-4 border-success text-success';
    } else {
      return 'card d-flex w-100 py-2 px-4';
    }
  }

  selectLocation(selectedLocation: any) {
    localStorage.setItem("location", selectedLocation.id)
    this.map.centerToAddress(`${this.selectedLocation.municipality}, España`)
    this.stepsCompleted[0] = 1;
    this.OnSelectorChange(this.selectedLocation, 'location')
  }

  OnSelectorChange(element: any, attribute: string) {
    //console.log(element, attribute)
    switch (attribute) {

      case 'location':

        this.resetCadastre();
        this.map.unselect();
        this.map.deleteMarkers();

        //console.log(this.selectedLocation, element)
        if (this.selectedLocation) {
          this.selectedCommunities = this.communities.map((community: any) => {
            if (community.location_id == this.selectedLocation.id) {
              return community;
            }
          }).filter((element: any) => element);

          this.renderSelectedCommunities();
        }
        this.selectedCommunity = null;

        this.updateCompleteSteps(0);

        //this.renderLocation();
        break;

      case 'community':

        this.updateCompleteSteps(1);
        //this.stepsCompleted[1] = 1;

        this.resetCadastre();
        this.map.unselect();
        this.map.deleteMarkers();

        if (this.newCommunity == element) {
          this.selectedCommunity = this.newCommunity;
          this.communityEnergyData = [];
          this.updateCommunityChart();
          this.communityCups = [];
        } else {
          this.getCommunityCups(this.selectedCommunity.id)
          this.getCommunityEnergy();
          //this.getCommunityPrices();
          this.map.selectMarker(this.selectedCommunity.lat, this.selectedCommunity.lng);
        }
        this.renderLocation();

        this.updateCompleteSteps(1);

        break;

      default:
        break;
    }

  }


  getCommunityCups(id: number) {
    this.communitiesService.getCups(id).subscribe((res: any) => {
      this.communityCups = res.data.filter((obj: any) => obj.type !== 'community');
      //console.log(this.communityCups.length,this.communityCups)
    })
  }

  getCommunityEnergy() {
    let date = moment().format('YYYY-MM-DD')

    //console.log("this.selectedCommunity.id",this.selectedCommunity.id)

    forkJoin({
      energyData: this.communitiesService.getEnergy(this.selectedCommunity.id, date),
      energyActives: this.communitiesService.getEnergyActivesById(this.selectedCommunity.id)
    }).subscribe(({ energyData, energyActives }: any) => {

      //merge import and export data:
      this.communityEnergyData = energyData.data.importData.map((importItem: any) => {

        const productionItem = energyData.data.productionData.find((prodItem: any) => prodItem.month_number === importItem.month_number);
        const mappedItem = {
          month: importItem.month,
          monthNumber: importItem.month_number,
          import: importItem.import,
          export: productionItem ? productionItem.export : 0
        };
        return mappedItem;
      });

      //console.log("Energy data", energyData, "Energy actives", energyActives)

      let communityActiveCups = energyActives.data[0].total_actives;
      let communityCups = energyActives.data[0].total_cups;

      //simulate total consumption:
      this.communityEnergyData = this.communityEnergyData.map((cupsMonthEnergy: any) => {
        let averageImport = cupsMonthEnergy.import / communityActiveCups;
        cupsMonthEnergy.import = averageImport * communityCups;
        return cupsMonthEnergy;
      });

      this.updateCommunityChart();

    }, error => {
      console.error("Error getting community energy or community actives", error)
    })

  }

  updateCommunityChart() {

    this.communityMonthChartLabels;
    this.communityMonthChartDatasets = [];
    this.communityMonthChartType = 'bar';

    let imports: number[] = [];
    let exports: number[] = [];

    this.communityEnergyData.forEach((item: any) => {
      //this.communityMonthChartLabels.push(item.month);
      //numeros_mes.push(item.month_number);
      imports.push(item.import + item.export);
      exports.push(item.export);
    });

    this.addedAreas.map((addedArea: any) => {

      addedArea.monthsConsumption?.map((monthConsumption: number, index: number) => {

        if (imports[index]) {
          imports[index] += monthConsumption;
          //total consumption implies the generation:
          imports[index] += addedArea.monthsGeneration[index];
        }

        if (!imports[index]) {
          //total consumption implies the generation:
          imports.push(monthConsumption + addedArea.monthsGeneration[index])
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
        label: 'Consum total (Kwh)',
        data: imports,
        backgroundColor: 'rgb(211, 84, 0)',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Producció comunitària (Kwh)',
        data: exports,
        backgroundColor: '#229954',
        borderColor: 'rgb(255,255,255)'
      }
    ]

    this.communityUpdateMonthChartSubject.next(true);

    this.updateCommunityValoration(exports, imports);

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

    //console.log(totalExports, totalImports)

    if (totalExports == 0 && totalImports == 0) {
      this.communityValoration = 0;
      return;
    }

    if (totalImports > (totalExports + 10)) {
      this.communityValoration = 3;
    } else if (totalExports > (totalImports + 10)) {
      this.communityValoration = 1;
    } else {
      this.communityValoration = 2;
    }

  }

  showLoading() {
    let that = this
    Swal.fire({
      title: 'Carregant informació',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: function () {
        Swal.showLoading();
        that.loading.subscribe((res) => {
          Swal.close();
        })

      }
    })
  }

  renderLocation() {
    //If the information is loaded, there is no need to make the request again
    if (this.energyAreas) { return }

    let geoJson: any = {
      "type": "FeatureCollection",
      "features": []
    }

    this.showLoading();

    this.energyAreasService.getByLocation(this.selectedLocation.id).subscribe(async (res: any) => {

      this.energyAreas = res.data;

      this.energyAreas.map((energyArea: any) => {
        let geoJsonFeature = energyArea.geojson_feature;
        geoJsonFeature = JSON.parse(geoJsonFeature)
        geoJsonFeature.properties.energyAreaId = energyArea.id;
        geoJson.features.push(geoJsonFeature)
      })

      this.cadastresMap = await this.map.addGeoJson(geoJson);

      this.loading.next(false);

      this.ngZone.run(() => {

        const clickListener = this.cadastresMap.addListener('click', (event: google.maps.Data.MouseEvent) => {

          this.resetCadastre();

          let latLng: any = event.latLng;

          this.selectedCoords = { lat: latLng.lat(), lng: latLng.lng() }

          const feature = event.feature;

          //if selected is false, the click was to deselect, so you don't have to do anything else
          let isSelectedArea = feature.getProperty('selected')
          if (!isSelectedArea) {
            this.stepsCompleted[3] = 0;
            //this.cdr.detectChanges()
            return;
          }

          let cadastre: any = feature.getProperty('localId')

          //check if selected area is an already added area
          let foundArea = this.addedAreas.find((addedArea) => addedArea.id == cadastre)
          if (foundArea) {
            this.selectedCadastre = foundArea;
            this.restoreCadastre();
            //his.cdr.detectChanges();
            return;
          }

          this.selectedCadastre.feature = feature;
          this.selectedCadastre.id = cadastre;

          let areaM2: any = feature.getProperty('areaM2');
          this.selectedCadastre.m2 = Math.floor(areaM2);
          this.stepsCompleted[3] = 1
          this.simulateGenerationConsumption();
          //this.cdr.detectChanges()

          Swal.fire({ text: `Àrea seleccionada: ${this.selectedCadastre.m2} m²`, showConfirmButton: false, timerProgressBar: false, timer: 1500, loaderHtml: '' })

        });

      }, (error: any) => {
        this.loading.next(false),
          Swal.fire({
            title: 'Error getting areas',
            icon: "error"
          })
      })

    });

  }

  renderSelectedCommunities() {

    this.map.deleteMarkers();

    this.selectedCommunities.map((community: any) => {

      if (community.lat && community.lng) {

        let marker = this.map.addMarker(community.lat, community.lng)

        marker.addListener('click', () => {
          this.selectedCommunity = community;
          this.map.selectMarker(community.lat, community.lng)
          this.getCommunityEnergy();
          this.renderLocation();
          TooltipDirective.forceClose.next(true)
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

  updateConsumptions() {
    this.updateCadastreConsumption();
    let monthConsumption = this.selectedCadastre.totalConsumption;
    let monthConsumptionArray: any = [];
    let sumMonthConsumption: number = 0;
    this.selectedCadastre.monthsGeneration?.map((element, index) => {
      monthConsumptionArray.push(monthConsumption);
      sumMonthConsumption += monthConsumption;
    })
    this.selectedCadastre.yearConsumption = sumMonthConsumption;
    this.selectedCadastre.monthsConsumption = monthConsumptionArray;
  }

  updateCadastreConsumptionM2() {

    let updatedConsumption = this.selectedCadastre.totalConsumption + this.selectedCadastre.m2!
    this.selectedCadastre.totalConsumption = updatedConsumption;

    //console.log("updateCadastreConsumptionM2", updatedConsumption)

    this.selectedCadastre.valle = this.selectedCadastre.totalConsumption * 0.50;
    this.selectedCadastre.llano = this.selectedCadastre.totalConsumption * 0.26;
    this.selectedCadastre.punta = this.selectedCadastre.totalConsumption * 0.24;

    //console.log("update consumption by m2", "valle:", this.selectedCadastre.valle, "llano:", this.selectedCadastre.llano, "punta:", this.selectedCadastre.punta, "total:", this.selectedCadastre.totalConsumption)
  }

  updateCadastreConsumption() {

    this.selectedCadastre.valle = Math.abs(this.selectedCadastre.valle)
    this.selectedCadastre.llano = Math.abs(this.selectedCadastre.llano)
    this.selectedCadastre.punta = Math.abs(this.selectedCadastre.punta)

    this.selectedCadastre.totalConsumption = this.selectedCadastre.valle + this.selectedCadastre.llano + this.selectedCadastre.punta

    this.selectedCadastre.valleMonthlyCost = this.selectedCadastre.valle * this.selectedCadastre.vallePrice
    this.selectedCadastre.llanoMonthlyCost = this.selectedCadastre.llano * this.selectedCadastre.llanoPrice
    this.selectedCadastre.puntaMonthlyCost = this.selectedCadastre.punta * this.selectedCadastre.puntaPrice

    this.selectedCadastre.monthlyConsumptionCost = this.selectedCadastre.valleMonthlyCost + this.selectedCadastre.llanoMonthlyCost + this.selectedCadastre.puntaMonthlyCost

  }

  featureSelected(selectedFeature: any) { }

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

  updateCadastreGenerationChart() {
    this.cdr.detectChanges();
    this.selectedCadastreGenerationMonthChartDatasets = [
      {
        label: 'Producció',
        data: this.selectedCadastre.monthsGeneration,
        backgroundColor: '#229954',
        borderColor: 'rgb(255,255,255)'
      }
    ]
    this.updateSelectedCadastreMonthChartSubject.next(true);
  }

  updateCadastreChart() {

    // if (this.selectedCadastreBackup.monthsConsumption == this.selectedCadastre.monthsConsumption &&
    //   this.selectedCadastreBackup.monthsGeneration == this.selectedCadastre.monthsGeneration &&
    //   this.selectedCadastreBackup.monthsSurplus == this.selectedCadastre.monthsSurplus) {
    //   console.log("backup igual")
    //   return;
    // }

    // console.log("backup diferent", this.selectedCadastreBackup.monthsConsumption, this.selectedCadastre.monthsConsumption,
    //   this.selectedCadastreBackup.monthsGeneration,this.selectedCadastre.monthsGeneration,
    //   this.selectedCadastreBackup.monthsSurplus,this.selectedCadastre.monthsSurplus)

    this.selectedCadastreMonthChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: this.selectedCadastre.monthsConsumption,
        backgroundColor: '#D35400',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Producció (Kwh)',
        data: this.selectedCadastre.monthsGeneration,
        backgroundColor: '#229954',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Surplus (Kwh)',
        data: this.selectedCadastre.monthsSurplus,
        backgroundColor: '#3498DB',
        borderColor: 'rgb(255,255,255)'
      }
    ]

    this.updateSelectedCadastreMonthChartSubject.next(true);

    this.updateSelectedCadastreValoration();

    this.selectedCadastreBackup.monthsConsumption = this.selectedCadastre.monthsConsumption;
    this.selectedCadastreBackup.monthsGeneration = this.selectedCadastre.monthsGeneration;
    this.selectedCadastreBackup.monthsSurplus = this.selectedCadastre.monthsSurplus;

  }

  // changeShrinkState() {
  //   this.isShrunk = !this.isShrunk;
  // }

  resetCadastre() {
    this.selectedCadastreGenerationMonthChartDatasets = [];
    this.selectedCadastreMonthChartDatasets = [];
    this.selectedCadastre = {
      totalConsumption: 200,
      valle: 98,
      llano: 52,
      punta: 48,
      vallePrice: 0.10,
      llanoPrice: 0.13,
      puntaPrice: 0.19,
      generationPrice: 0.10,
      orientation: 0,
      inclination: 25,
      selfConsumption: {}
    }
  }

  addArea() {
    this.ngZone.run(() => {
      let found = this.addedAreas.find((addedArea: any) => addedArea.id == this.selectedCadastre.id)
      //console.log("add Area found", found)
      if (found) {
        this.addedAreas = [...this.addedAreas]
        Swal.fire({ text: 'Àrea actualitzada', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-check text-success"></i>', timer: 2000, customClass: { icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      } else {
        this.addedAreas = this.addedAreas.concat([this.selectedCadastre])
        this.updateCommunityChart()
        this.map.activeArea(this.selectedCadastre)
        Swal.fire({ text: 'Àrea afegida', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-check text-success"></i>', timer: 2000, customClass: { icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      }
      //console.log(this.addedAreas)

      //this.resetCadastre(); //TO RESET SELECTED AREA WHEN AREA ADDED.
    })
  }

  deleteArea(index: number) {
    Swal.fire({ title: `Estàs a punt d'esborrar l'àrea`, text: 'Segur que vols fer-ho?', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>', customClass: { confirmButton: 'btn btn-secondary', icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5', cancelButton: 'btn btn-danger' } })
      .then((result) => {
        if (result.isConfirmed) {
          this.map.deleteArea(this.addedAreas[index])
          this.addedAreas.splice(index, 1);
          this.resetCadastre();
          this.updateCommunityChart();
          this.cdr.detectChanges();
        } else if (result.isDenied) {
        }
      })
  }

  unselectArea(feature: any) {
    this.map.unselectArea(feature)
    this.resetCadastre();
    // this.cdr.detectChanges();
  }

  editArea(index: number) {
    this.map.selectArea(this.addedAreas[index])
    this.selectedCadastre = this.addedAreas[index];
    this.stepActive = 5;
    this.changeStep(5);
  }

  calculateSurplus() {
    //reset the value:
    this.selectedCadastre.monthsSurplus = [];

    //insert the new values
    //generation - consumption = surplus
    this.selectedCadastre.monthsGeneration?.map((generation, index) => {
      let consumption: number = this.selectedCadastre.monthsConsumption![index]
      let surplus: number[] = []
      if (generation > consumption) {
        let surplus = generation - consumption;
        this.selectedCadastre.monthsSurplus!.push(surplus)
      } else {
        this.selectedCadastre.monthsSurplus!.push(0)
      }
    })
  }

  /** Obtains the price of average month
   *  calculates the excedent energy price, the consumption saving price and the years to amortize the investment.
   */
  calculateMonthlySavings() {

    let monthAverageGeneration: number = this.selectedCadastre.yearGeneration! / 12;
    let oldMonthAverageConsumption: number = this.selectedCadastre.yearConsumption! / 12;
    //this will be the consumption without production
    let monthAverageConsumption: number = oldMonthAverageConsumption;
    let monthlyConsumedProduction: number = 0;
    let monthlyCosts = this.selectedCadastre.monthlyConsumptionCost; //monthAverageConsumption * this.selectedCadastre.llanoPrice;
    let communityMonthlyCosts: number;
    
    //if surplus:

    if (monthAverageGeneration > monthAverageConsumption) {
      //surplus is the generation minus consumption, if generation is greater than consumption
      let monthAverageSurplus: number = monthAverageGeneration - monthAverageConsumption;
      //monthlyConsumedProduction is the production directly used by the customer
      monthlyConsumedProduction = monthAverageGeneration - monthAverageSurplus;

      //surplusMonthlyProfits is the price of excedent from generation that is sold to the company or to community
      //if it's sold to the community
      this.selectedCadastre.surplusMonthlyProfits = monthAverageSurplus * this.selectedCommunity.energy_price!;
      
      // if it's sold to the company
      this.selectedCadastre.selfConsumption.surplusMonthlyProfits = monthAverageSurplus * this.selectedCadastre.generationPrice!;

      monthAverageConsumption = 0;  //the generation convalidates consumption

    } else {
      //monthlyConsumedProduction is the production directly used by the customer
      monthlyConsumedProduction = monthAverageGeneration;
      //update consuption considering generation:
      monthAverageConsumption = monthAverageConsumption - monthAverageGeneration;
      this.selectedCadastre.surplusMonthlyProfits = 0;
    }

    //in community, the energy to consume is bought to the community, with the price of the community
    communityMonthlyCosts = monthAverageConsumption * this.selectedCommunity.energy_price //this.selectedCadastre.generationPrice!;
    //monthlySavings is the price of energy that you stop using from the company when you have generation
    this.selectedCadastre.monthlySavings = monthlyCosts! - communityMonthlyCosts //monthlyConsumedProduction * this.selectedCadastre.generationPrice!;

    //self consumption
    this.selectedCadastre.selfConsumption.communityMonthlyCosts = (monthAverageConsumption / oldMonthAverageConsumption) * this.selectedCadastre.monthlyConsumptionCost!;
    this.selectedCadastre.selfConsumption.monthlySavings = monthlyCosts! - this.selectedCadastre.selfConsumption.communityMonthlyCosts;

    this.selectedCadastre.monthlySavings! += this.selectedCadastre.surplusMonthlyProfits!;

    if (this.selectedCadastre.monthlySavings! > monthlyCosts!) {
      this.selectedCadastre.selfConsumption.monthlySavings = monthlyCosts!;
    }

    this.selectedCadastre.monthlySavings = parseFloat(this.selectedCadastre.monthlySavings!.toFixed(2))
    this.selectedCadastre.selfConsumption.monthlySavings = parseFloat(this.selectedCadastre.selfConsumption.monthlySavings!.toFixed(2))

    //the redeem years are the profits earned month by month:
    this.selectedCadastre.redeemYears = Math.ceil(this.selectedCadastre.totalCost! / (12 * (this.selectedCadastre.monthlySavings!)));
    this.selectedCadastre.selfConsumption.redeemYears = Math.ceil(this.selectedCadastre.totalCost! / (12 * (this.selectedCadastre.selfConsumption.monthlySavings!)));

    //console.log(this.selectedCadastre)

  }

  optimizeSolarPanels() {
    //TODO: change algorithm to insert solar panels or accept consumption
  }

  async calculateSolarParams() {

    return new Promise((resolve, reject) => {
      //console.log("this.selectedCadastre.m2!,this.selectedOrientation,this.selectedInclination",
      // this.selectedCadastre.m2!, this.selectedCadastre.orientation, this.selectedCadastre.inclination)
      let n_plaques;
      this.energyAreasService.simulate(this.selectedCoords.lat, this.selectedCoords.lng, this.selectedCadastre.m2!, this.selectedCadastre.orientation!, this.selectedCadastre.inclination!, n_plaques!)
        .subscribe((res: any) => {
          if (!res.success) {
            reject(res.message);
          } else {
            let data = res.data
            const kWp = data.kWp
            const totalProduction = data.totalProduction
            const numberPanels = data.numberPanels
            const prodByMonth = data.prodByMonth
            const totalCost = data.totalCost

            this.selectedCadastre.InsalledPower = kWp;
            this.selectedCadastre.n_plaques = numberPanels;
            this.selectedCadastre.totalCost = totalCost.toFixed(2);
            this.selectedCadastre.yearGeneration = parseInt(totalProduction.toFixed(2))
            Object.keys(prodByMonth).forEach(function (key) {
              prodByMonth[key] = Math.floor(prodByMonth[key]);
            });
            this.selectedCadastre.monthsGeneration = Object.values(prodByMonth);
            // console.log('Installed power', kWp, 'kWp');
            // console.log('Number panels:', numberPanels);
            // console.log('Cost:', totalCost.toFixed(2), '€');
            // console.log('Total year production:', totalProduction.toFixed(2), 'kWh');
            // console.log('Production by months:', this.selectedCadastre.monthsGeneration);
            resolve('success')
          }

        }, (error: any) => {
          console.log("simulation not ok", error)
          reject(error)
        });
    })

  }

  async simulateGeneration() {
    this.updateCadastreConsumptionM2();
    await this.simulateGenerationConsumption();
  }

  async simulateGenerationConsumption() {

    if (
      this.selectedCadastre.oldM2 !== this.selectedCadastre.m2 ||
      this.selectedCadastre.oldInclination !== this.selectedCadastre.inclination ||
      this.selectedCadastre.oldOrientation !== this.selectedCadastre.orientation
    ) {

      this.startSpin();
      this.showLoading();

      try {
        await this.calculateSolarParams();
      } catch (error) {
        this.loading.next(false);
        Swal.fire('Error', 'Error calculant la simulació', 'error');
        return;
      }

      this.loading.next(false);

    }

    this.updateSimulationParams();

    this.updateConsumptions();

    //if (this.activeCce) {
    //  this.calculateCCE()
    //} else {
    this.calculateSurplus();
    this.calculateMonthlySavings();
    this.updateCadastreGenerationChart();
    //}

    this.updateCadastreChart();

    this.activeSimulation = true;

  }

  restoreCadastre() {
    this.updateCadastreGenerationChart();
    this.activeSimulation = true;
    this.updateConsumptions();
    //this.calculateMonthlySavings();
    this.updateCadastreChart();
  }

  updateSimulationParams() {
    this.selectedCadastre.oldM2 = this.selectedCadastre.m2
    this.selectedCadastre.oldInclination = this.selectedCadastre.inclination
    this.selectedCadastre.oldOrientation = this.selectedCadastre.orientation
  }

  // openChartModal(labels: any, datasets: any, options: any, updateSubject: any) {
  //   const modalRef = this.modalService.open(ChartModalComponent, { fullscreen: true })
  //   modalRef.componentInstance.labels = this.monthChartLabels
  //   modalRef.componentInstance.datasets = this.communityMonthChartDatasets
  //   let customModalOptions = { ... this.communityMonthChartOptions }
  //   customModalOptions.aspectRatio = 0.5
  //   // modalRef.componentInstance.options = this.communityMonthChartOptions
  //   modalRef.componentInstance.options = customModalOptions
  //   modalRef.componentInstance.updateSubject = this.communityUpdateMonthChartSubject
  // }

  startSpin() {
    this.isSpinning = true;
    setTimeout(() => {
      this.isSpinning = false;
    }, 2000); // 2 segundos
  }

}
