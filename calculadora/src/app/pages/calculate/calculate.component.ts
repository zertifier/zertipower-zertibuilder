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
import {CalculateInfoModalComponent} from "./calculate-info-modal/calculate-info-modal.component";
import { calculateEnergyBalance, EnergyBalance } from '../../services/energy-balance';

const CALCULATOR_ESTIMATE_PROFILE = [260, 230, 220, 190, 170, 160, 150, 150, 180, 210, 230, 250];

interface cadastre {
  id?: string;
  consumptionSource?: string,
  consumptionLabel?: string,
  consumptionCupsId?: number | null,
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
  yearlySavings?: number,
  totalConsumptionPrice?: number,
  yearConsumption?: number,
  yearGeneration?: number,
  monthsConsumption?: number[],
  monthsGeneration?: number[],
  monthsSurplus?: number[],
  monthsSelfConsumption?: number[],
  monthsImport?: number[],
  monthsExport?: number[],
  energyBalance?: EnergyBalance,
  m2?: number,
  oldM2?: number,
  n_plaques?: number,
  inversion?: number,
  savings?: number,
  amortization_years?: number,
  feature?: any,
  totalCost?: number,
  monthlySavings?: number,
  InsalledPower?: number,
  energyAreaId?: number,
  inverterPowerKw?: number | null,
  solarLatitude?: number,
  solarLongitude?: number,
  solarBusy?: boolean,
  solarError?: string,
  solarResult?: { daily: { date: string; kwh: number }[]; input: { kwp: number; tilt: number; azimuth: number } },
  solarTilt?: number,
  solarAzimuth?: number,
  solarSavedCommunityId?: number,
  solarSavedReference?: string,
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
  private modalService = inject(NgbModal);

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
  newCommunity: any = {
    energy_price: 0.09
  };
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
    { name: 'Est', value: -90 },
    { name: 'Oest', value: 90 }
  ];
  inclinations: any[] = [
    { name: '2°', value: 2 },
    { name: '13°', value: 13 },
    { name: '25°', value: 25 },
    { name: '35°', value: 35 }
  ];
  communityValoration: number = 0;
  communityEnergyData: any = [];
  communityMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Desembre'];
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
  selectedCadastreMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Desembre'];
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
    totalConsumption: 0,
    consumptionSource: 'pending',
    valle: 0,
    llano: 0,
    punta: 0,
    vallePrice: 0.09,
    llanoPrice: 0.13,
    puntaPrice: 0.17,
    generationPrice: 0.05,
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
        //this.stepActive = 2;
        //this.stepsCompleted[0] = 1;
        //this.updateCompleteSteps(0);
      }
    } catch {
      console.log("location unselected")
    }

    // this.openCalculateInfoModal()
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

    if (stepDestination == 5 && this.stepActive<=stepDestination) {
      this.stepsCompleted[4] = 1;
      this.simulateGenerationConsumption()
    }

    if(this.stepActive==6 && this.stepActive !==stepDestination){
      this.map.selectArea(this.addedAreas[this.addedAreas.length-1])
      this.selectedCadastre = this.addedAreas[this.addedAreas.length-1];
      this.simulateGenerationConsumption();
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
          this.loadCommunitySelections();
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
    let surplus: number[] = [];

    this.communityEnergyData.forEach((item: any) => {
      //this.communityMonthChartLabels.push(item.month);
      //numeros_mes.push(item.month_number);
      if (item.import) {
        imports.push(item.import)
      } else {
        imports.push(0)
      }

      if (item.export) {
        exports.push(item.export)
      } else {
        exports.push(0)
      }

      if (item.import && item.export && item.import < item.export) {
        surplus.push(item.export - item.import)
      } else {
        surplus.push(0)
      }

    });

    console.log("this.communityEnergyData", this.communityEnergyData);

    console.log("imports", imports)
    console.log("exports", exports)
    console.log("surplus", surplus)

    this.addedAreas.map((addedArea: any) => {

      console.log("area consumtion", addedArea.monthsConsumption)
      console.log("area generation", addedArea.monthsGeneration)

      const balance = calculateEnergyBalance(addedArea.monthsGeneration || Array(12).fill(0), addedArea.monthsConsumption || Array(12).fill(0));
      balance.months.forEach((month, index) => {

        //console.log("addedArea",addedArea)

        if (imports[index] != undefined && imports[index] != null) {
          imports[index] += month.import;
          //imports[index] += monthConsumption;
          //total consumption implies the generation:
          // imports[index] += addedArea.monthsGeneration[index];
        }

        if (!imports[index]) {
          imports[index] = month.import
          //total consumption implies the generation:
          // imports.push(monthConsumption + addedArea.monthsGeneration[index])
        }

        if (exports[index] != undefined && exports[index] != null) {
          exports[index] += month.production;
        }

        if (!exports[index]) {
          exports[index] = month.production
        }

        if (surplus[index] != undefined && surplus[index] != null) {
          surplus[index] += month.export
        }

        if (!surplus[index]) {
          surplus[index] = month.export
        }

      })
    })

    //console.log("imports",imports,"exports",exports)

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
      },
      {
        label: 'Excedent (Kwh)',
        data: surplus,
        backgroundColor: '#3498DB',
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

          this.selectedCadastre.solarLatitude = latLng.lat();
          this.selectedCadastre.solarLongitude = latLng.lng();
          this.selectedCadastre.feature = feature;
          this.selectedCadastre.id = cadastre;
          this.selectedCadastre.energyAreaId = Number(feature.getProperty('energyAreaId'));

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

  async loadConsumption(force = false) {
    const house = this.selectedCadastre;
    if (!force && house.consumptionSource && house.consumptionSource !== 'pending') return;
    if (house.consumptionSource === 'manual') return;
    // The calculator is deliberately independent from CUPS, Datadis and
    // meter history. Until the user enters the three tariff-period values,
    // expose an explicitly labelled simulation estimate.
    house.monthsConsumption = [...CALCULATOR_ESTIMATE_PROFILE];
    house.yearConsumption = CALCULATOR_ESTIMATE_PROFILE.reduce((sum, value) => sum + value, 0);
    house.consumptionSource = 'estimate-calculator';
    house.consumptionLabel = 'Consum estimat de la simulació (sense comptador ni històric). Introdueix els teus valors per substituir-lo.';
    house.totalConsumption = house.yearConsumption / 12;
    house.valle = house.totalConsumption / 6;
    house.llano = house.totalConsumption / 3;
    house.punta = house.totalConsumption / 2;
  }

  async changeConsumptionPoint() {
    this.selectedCadastre.consumptionSource = 'pending';
    await this.loadConsumption(true);
    await this.simulateGenerationConsumption();
  }

  manualConsumptionChanged() {
    this.selectedCadastre.consumptionSource = 'manual';
    this.selectedCadastre.consumptionLabel = 'Consum introduït manualment; mateix valor mensual per als dotze mesos.';
    this.updateConsumptions();
  }

  updateConsumptions() {
    this.updateCadastreConsumption();
    const house = this.selectedCadastre;
    if (house.consumptionSource === 'manual') house.monthsConsumption = Array(12).fill(house.totalConsumption);
    house.monthsConsumption = house.monthsConsumption || Array(12).fill(0);
    house.yearConsumption = Number(house.monthsConsumption.reduce((sum, value) => sum + value, 0).toFixed(2));
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
        label: 'Excedent (Kwh)',
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
      totalConsumption: 0,
      consumptionSource: 'pending',
      valle: 0,
      llano: 0,
      punta: 0,
      vallePrice: 0.09,
      llanoPrice: 0.13,
      puntaPrice: 0.17,
      generationPrice: 0.05,
      orientation: 0,
      inclination: 25,
      selfConsumption: {}
    }
  }

  async addArea() {
    if (!await this.saveSelectedArea(this.selectedCadastre)) return;
    console.log(this.selectedCadastre)
    this.ngZone.run(() => {
      let found = this.addedAreas.find((addedArea: any) => addedArea.id == this.selectedCadastre.id)
      //console.log("add Area found", found)
      if (found) {
        this.addedAreas = this.addedAreas.map(area => area.id === this.selectedCadastre.id ? this.selectedCadastre : area);
        this.updateCommunityChart();

        Swal.fire({ text: 'Àrea actualitzada', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-check text-success"></i>', timer: 2000, customClass: { icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
      } else {
        this.addedAreas = this.addedAreas.concat([this.selectedCadastre])
        this.updateCommunityChart()
        this.map.activeArea(this.selectedCadastre)

        Swal.fire({ text: 'Àrea afegida', iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-check text-success"></i>', timer: 2000, customClass: { icon: 'border-0', htmlContainer: 'd-flow justify-content-center px-md-5' } })
        this.resetCadastre(); //TO RESET SELECTED AREA WHEN AREA ADDED.
      }
      //console.log(this.addedAreas)


    })
  }

  solarConfigurationReady(area: cadastre): boolean {
    return area.oldM2 === area.m2 && area.oldInclination === area.inclination &&
      area.oldOrientation === area.orientation &&
      typeof area.solarTilt === 'number' && typeof area.solarAzimuth === 'number';
  }

  private selectionPayload(area: cadastre) {
    return {communityId:Number(this.selectedCommunity?.id), energyAreaId:area.energyAreaId,
      roofReference:String(area.id || ''), latitude:area.solarLatitude, longitude:area.solarLongitude,
      areaM2:area.m2, tilt:area.solarTilt, azimuth:area.solarAzimuth, panelCount:area.n_plaques, kwp:area.InsalledPower,
      monthlyGenerationKwh:area.monthsGeneration, monthlyConsumptionKwh:area.monthsConsumption,
      calculatorValues:Object.fromEntries(['valle','llano','punta','vallePrice','llanoPrice','puntaPrice','generationPrice','totalCost','yearlySavings']
        .filter(key => (area as any)[key] != null && Number.isFinite(Number((area as any)[key])))
        .map(key => [key,Number((area as any)[key])])),
      consumptionSource:area.consumptionSource, consumptionLabel:area.consumptionLabel, source:'simulation'};
  }

  async saveSelectedArea(area: cadastre): Promise<boolean> {
    if (!this.selectedCommunity?.id || !area.energyAreaId || !this.solarConfigurationReady(area)) {
      await Swal.fire('Configuració incompleta', 'Selecciona una comunitat i espera que acabi la simulació de la coberta.', 'info');
      return false;
    }
    try {
      const response = await this.energyAreasService.saveSelection(this.selectionPayload(area));
      if (!response.success) throw new Error(response.message);
      area.solarSavedCommunityId = Number(this.selectedCommunity.id);
      area.solarSavedReference = response.data.roofReference;
      return true;
    } catch {
      await Swal.fire('No s’ha desat', 'No s’ha pogut guardar l’àrea seleccionada. Torna-ho a provar.', 'error');
      return false;
    }
  }

  async persistCommunityRoof(area: cadastre) { await this.addArea(); }

  async loadCommunitySelections() {
    const id = Number(this.selectedCommunity?.id);
    this.addedAreas = [];
    try {
      const response = await this.energyAreasService.listSelections(id);
      if (Number(this.selectedCommunity?.id) !== id) return;
      if (!response.success) throw new Error(response.message);
      this.addedAreas = response.data.map((roof: any) => ({
        ...this.selectedCadastre, id:roof.roofReference, energyAreaId:roof.energyAreaId,
        solarLatitude:roof.latitude, solarLongitude:roof.longitude, m2:roof.areaM2,oldM2:roof.areaM2,
        inclination:roof.tilt,oldInclination:roof.tilt,solarTilt:roof.tilt,
        orientation:roof.azimuth,oldOrientation:roof.azimuth,solarAzimuth:roof.azimuth,
        n_plaques:roof.panelCount,InsalledPower:roof.kwp,
        monthsGeneration:roof.monthlyGenerationKwh || Array(12).fill(0),
        yearGeneration:(roof.monthlyGenerationKwh || []).reduce((a:number,b:number)=>a+b,0),
        monthsConsumption:roof.monthlyConsumptionKwh || Array(12).fill(0),
        yearConsumption:(roof.monthlyConsumptionKwh || []).reduce((a:number,b:number)=>a+b,0),
        totalConsumption:(roof.monthlyConsumptionKwh || []).reduce((a:number,b:number)=>a+b,0)/12,
        valle:(roof.monthlyConsumptionKwh || []).reduce((a:number,b:number)=>a+b,0)/72,
        llano:(roof.monthlyConsumptionKwh || []).reduce((a:number,b:number)=>a+b,0)/36,
        punta:(roof.monthlyConsumptionKwh || []).reduce((a:number,b:number)=>a+b,0)/24,
        ...roof.calculatorValues,
        consumptionSource:roof.consumptionSource, consumptionLabel:roof.consumptionLabel,consumptionCupsId:roof.consumptionCupsId,
        solarSavedCommunityId:id,solarSavedReference:roof.roofReference,selfConsumption:{}
      }));
      this.updateCommunityChart();
    } catch { await Swal.fire('Error', 'No s’han pogut carregar les àrees desades.', 'error'); }
  }

  deleteArea(index: number) {
    Swal.fire({
      title: `Estàs a punt d'esborrar l'àrea`,
      text: 'Segur que vols fer-ho?',
      showDenyButton:true,
      iconHtml: '<i style="font-size:50px;overflow-y:hidden;" class="fa-solid fa-circle-exclamation"></i>',
      customClass: {
        confirmButton: 'px-4 py-2',
        icon: 'border-0',
        htmlContainer: 'd-flow justify-content-center px-md-5',
        denyButton: 'px-4 py-2'
      }
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          const removedArea = this.addedAreas[index];
          if (removedArea.solarSavedCommunityId && removedArea.energyAreaId) {
            try { await this.energyAreasService.removeSelection(removedArea.solarSavedCommunityId, removedArea.energyAreaId); }
            catch { await Swal.fire('Error', 'No s’ha pogut eliminar la selecció desada.', 'error'); return; }
          }
          this.map.deleteArea(removedArea)
          this.addedAreas.splice(index, 1);
          this.resetCadastre();
          this.updateCommunityChart();
          this.cdr.detectChanges();
          if (!this.addedAreas.length) {
            //return to point 4;
            this.stepsCompleted[3] = 0;
            this.stepsCompleted[4] = 0;
            this.changeStep(4);
          }
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
    const balance = calculateEnergyBalance(this.selectedCadastre.monthsGeneration || Array(12).fill(0), this.selectedCadastre.monthsConsumption || Array(12).fill(0));
    this.selectedCadastre.energyBalance = balance;
    this.selectedCadastre.monthsSurplus = balance.months.map(month => month.export);
    this.selectedCadastre.monthsSelfConsumption = balance.months.map(month => month.selfConsumption);
    this.selectedCadastre.monthsImport = balance.months.map(month => month.import);
    this.selectedCadastre.monthsExport = balance.months.map(month => month.export);
  }

  /** Obtains the price of average month
   *  calculates the excedent energy price, the consumption saving price and the years to amortize the investment.
   */
  calculateMonthlySavings() {
    const balance = this.selectedCadastre.energyBalance || calculateEnergyBalance(
      this.selectedCadastre.monthsGeneration || Array(12).fill(0), this.selectedCadastre.monthsConsumption || Array(12).fill(0));
    const importedPrice = this.selectedCadastre.totalConsumption > 0
      ? (this.selectedCadastre.valle * this.selectedCadastre.vallePrice + this.selectedCadastre.llano * this.selectedCadastre.llanoPrice + this.selectedCadastre.punta * this.selectedCadastre.puntaPrice) / this.selectedCadastre.totalConsumption : 0;
    const communityPrice = Number(this.selectedCommunity?.energy_price || 0);
    const exportPrice = Number(this.selectedCadastre.generationPrice || 0);
    const avoidedCost = balance.annual.selfConsumption * importedPrice;
    const communityCompensation = balance.annual.export * communityPrice;
    const individualCompensation = balance.annual.export * exportPrice;
    this.selectedCadastre.surplusMonthlyProfits = Number((communityCompensation / 12).toFixed(2));
    this.selectedCadastre.selfConsumption.surplusMonthlyProfits = Number((individualCompensation / 12).toFixed(2));
    this.selectedCadastre.monthlySavings = Number(((avoidedCost + communityCompensation) / 12).toFixed(2));
    this.selectedCadastre.selfConsumption.monthlySavings = Number(((avoidedCost + individualCompensation) / 12).toFixed(2));
    this.selectedCadastre.selfConsumption.communityMonthlyCosts = Number((balance.annual.import * communityPrice / 12).toFixed(2));
    this.selectedCadastre.redeemYears = this.selectedCadastre.monthlySavings > 0 ? Math.ceil(this.selectedCadastre.totalCost! / (12 * this.selectedCadastre.monthlySavings)) : undefined;
    this.selectedCadastre.selfConsumption.redeemYears = this.selectedCadastre.selfConsumption.monthlySavings > 0 ? Math.ceil(this.selectedCadastre.totalCost! / (12 * this.selectedCadastre.selfConsumption.monthlySavings)) : undefined;
    this.selectedCadastre.yearlySavings = Number((this.selectedCadastre.monthlySavings * 12).toFixed(2));

  }

  optimizeSolarPanels() {
    //TODO: change algorithm to insert solar panels or accept consumption
  }

  openCalculateInfoModal() {
    const modalRef = this.modalService.open(CalculateInfoModalComponent, {size: 'xl', scrollable: true});
  }

  simulateSelectedRoof() {
    const house = this.selectedCadastre;
    if (house.solarBusy) return;
    if (!this.solarConfigurationReady(house)) {
      house.solarError = 'Espera que es recalculin les dades de la coberta abans de simular.';
      return;
    }
    house.solarResult = undefined;
    house.solarError = '';
    const input = { latitude: house.solarLatitude!, longitude: house.solarLongitude!,
      kwp: house.InsalledPower!, tilt: house.solarTilt!, azimuth: house.solarAzimuth!,
      areaM2: house.m2!, panelCount: house.n_plaques! };
    if (Object.values(input).some(v => typeof v !== 'number' || !Number.isFinite(v)) || input.kwp <= 0) {
      house.solarError = 'Selecciona una coberta i indica la potència fotovoltaica en kWp.';
      return;
    }
    house.solarBusy = true;
    this.energyAreasService.simulateRoof(input).subscribe({
      next: (response: any) => {
        house.solarBusy = false;
        if (response.success && Array.isArray(response.data?.daily)) house.solarResult = response.data;
        else house.solarError = 'No s’ha pogut completar la simulació. Torna-ho a provar.';
      },
      error: () => {
        house.solarBusy = false;
        house.solarError = 'No s’ha pogut obtenir la radiació o completar la previsió. Torna-ho a provar.';
      },
    });
  }

  async calculateSolarParams() {
    const house = this.selectedCadastre;
    const snapshot = { latitude: house.solarLatitude!, longitude: house.solarLongitude!,
      m2: house.m2!, inclination: house.inclination!, orientation: house.orientation! };

    return new Promise((resolve, reject) => {
      //console.log("this.selectedCadastre.m2!,this.selectedOrientation,this.selectedInclination",
      // this.selectedCadastre.m2!, this.selectedCadastre.orientation, this.selectedCadastre.inclination)
      let n_plaques;
      this.energyAreasService.simulate(snapshot.latitude, snapshot.longitude, snapshot.m2, snapshot.orientation, snapshot.inclination, n_plaques!, house.energyAreaId)
        .subscribe((res: any) => {
          if (this.selectedCadastre !== house || house.m2 !== snapshot.m2 ||
              house.inclination !== snapshot.inclination || house.orientation !== snapshot.orientation) {
            reject('La configuració ha canviat durant el càlcul.');
            return;
          }
          if (!res.success) {
            reject(res.message);
          } else {
            let data = res.data
            const kWp = data.kWp
            const totalProduction = data.totalProduction
            //console.log(totalProduction) //todo check that is anual production
            //this.selectedCadastre.anualProduction = totalProduction;
            const numberPanels = data.numberPanels
            const prodByMonth = data.prodByMonth
            const totalCost = data.totalCost

            this.selectedCadastre.energyAreaId = data.energyAreaId;
            this.selectedCadastre.solarLatitude = data.latitude;
            this.selectedCadastre.solarLongitude = data.longitude;
            this.selectedCadastre.solarTilt = data.tilt;
            this.selectedCadastre.solarAzimuth = data.azimuth;
            this.selectedCadastre.solarResult = undefined;
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
    await this.simulateGenerationConsumption();
  }

  async simulateGenerationConsumption() {
    await this.loadConsumption();

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

  isEqual(obj1: any, obj2: any): boolean {
    // Si ambas referencias son iguales
    //if (obj1 === obj2) return true;

    // Si alguno de los dos es null o no es un objeto, no son iguales
    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return false;
    }

    // Comparar el número de propiedades
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    // Comparar valores de cada propiedad
    for (const key of keys1) {
      if (!keys2.includes(key) || !this.isEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

}
