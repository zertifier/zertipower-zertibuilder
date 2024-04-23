import {AfterViewInit, Component, HostListener, OnInit, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import { CustomersService } from "../../../core/core-services/customers.service";
import { AppMapComponent } from "../../../shared/infrastructure/components/map/map.component";
import { CommunitiesApiService } from "../../communities/communities.service";
import { EnergyAreasService } from "../../../core/core-services/energy-areas.service";
import * as turf from '@turf/turf'
import { LocationService } from 'src/app/core/core-services/location.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';
import { generateToken } from 'src/app/shared/domain/utils/RandomUtils';
import Swal from 'sweetalert2';
import { TooltipPosition, TooltipTheme } from 'src/app/shared/infrastructure/directives/tooltip/tooltip.enums';
import { TooltipDirective } from 'src/app/shared/infrastructure/directives/tooltip/tooltip.directive';
import { EnergyBlocksApiService } from '../../energy-blocks/energy-blocks.service';
import {AppChartComponent} from "../../../shared/infrastructure/components/chart/chart.component";


interface cadastre {
  id?: string;
  totalConsumption: number,
  valle: number,
  llano: number,
  punta: number,
  vallePrice: number,
  llanoPrice: number,
  puntaPrice: number,
  valleMonthlyPrice?: number,
  llanoMonthlyPrice?: number,
  puntaMonthlyPrice?: number,
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
  oldInclination?: number
}

@ViewChild(TooltipDirective)

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
  orientations: any[] = [
    { name: 'Sud', value: 0 },
    //{ name: 'Sudest', value: 30 },
    //{ name: 'Sudoest', value: 30 },
    { name: 'Est', value: 90 },
    { name: 'Oest', value: 90 }
  ];
  inclinations: any[] = [
    { name: 'Inclinació mínima. A partir de 5%', value: 2 },
    { name: 'Inclinació baixa. Entre 10 - 15 %', value: 13 },
    { name: 'Inclinació mitjana. Entre 20 - 30 %', value: 25 },
    { name: 'Inclinació alta. Entre 30 - 40 %', value: 35 }
  ];
  communityValoration: number = 0;
  communityEnergyData: any = [];
  communityMonthChartLabels: any = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  communityMonthChartDatasets: any = [];
  communityMonthChartType = 'bar';
  communityUpdateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  communityDeleteMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
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
            pointStyle: 'circle'
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
  selectedCadastreMonthChartOptions =
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
    inclination: 25
  };

  cupsNumber: number = 0;
  addedAreas: any[] = [];

  TooltipPosition: typeof TooltipPosition = TooltipPosition;
  TooltipTheme: typeof TooltipTheme = TooltipTheme;

  @ViewChild(AppMapComponent) map!: AppMapComponent;

  folder: number = 1;
  isShrunk: boolean = false;

  loading: Subject<boolean> = new Subject<boolean>;

  engineeringCost: number = 1623;
  installationCost: number[] = [0.35, 0.3, 0.24];
  invertersCost: number[] = [0.105, 0.087, 0.072];
  managementCost: number[] = [1500, 1500, 2000];
  panelsCost: number = 0.265;
  structureCost: number = 0.07;
  pvCalc: string = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?peakpower=1&loss=14&mountingplace=building&outputformat=json";
  seriesCalc: string = "https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?peakpower=1&loss=14&mountingplace=building&outputformat=json&startyear=2016&endyear=2020";
  selectedCoords: any;

  activeSimulation: boolean = false;
  activeIndividual: boolean = false;
  activeCommunity: boolean = false;
  activeAcc: boolean = true;
  activeCce: boolean = false;

  communitySelectionTooltip: any =
    `
    <span class="m-0 fs-12">Selecciona una comunitat de la llista o fes clic en una de les icones d'ubicació del mapa.<br>
    Recorda que pots tornar a fer una nova cerca seleccionant de nou la comunitat o ciutat.</span>
  `

  inclinationTooltipText: any =
    `
  <div class="row m-0 p-0">
    <div class="col-12 m-0 p-0 form-text">
      <span class="m-0 fs-12">0% per a finques de pisos</span><br>
      <span class="m-0 fs-12">10-15% per zones sense plujes</span><br>
      <span class="m-0 fs-12">20-30% per zones amb plujes moderades</span><br>
      <span class="m-0 fs-12">30-40% per zones amb plujes fortes</span>
    </div>
  </div>
  `

  surplusTooltipText: any =
    `
  <div class="row m-0 p-0">
    <div class="col-12 m-0 p-0 form-text">
      <span class="m-0 fs-12">Definit per la companyia segons autoconsum o ACC</span><br>
      <span class="m-0 fs-12">o per la comunitat energética segons CCE</span><br>
    </div>
  </div>
  `

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
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.setMobileStatus(window.innerWidth) != this.isMobile) {
      this.isMobile = this.setMobileStatus(window.innerWidth)
      this.setMobileDesktopOptions()
      this.communityDeleteMonthChartSubject.next(true)
    }
    // this.communityMonthChartOptions.indexAxis= this.isMobile ? 'y' : 'x'
    // this.setMobileOptions()
    // this.communityDeleteMonthChartSubject.next(true)
    // this.updateCommunityChart()

  }

  async ngOnInit() {
    if (this.setMobileStatus(window.innerWidth) != this.isMobile) {
      this.isMobile = this.setMobileStatus(window.innerWidth)
      this.setMobileDesktopOptions()
      this.communityDeleteMonthChartSubject.next(true)
    }

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
      inclination: 25
    }
    this.activeIndividual = false;
    this.activeCommunity = false;
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
        console.log("selected community", this.selectedCommunity)
        if (this.selectedCommunity == this.newCommunity) {
          this.communityEnergyData = [];
          this.updateCommunityChart();
        } else {
          this.getCommunityEnergy();
          //this.getCommunityPrices();
          this.map.selectMarker(this.selectedCommunity.lat, this.selectedCommunity.lng);
        }
        this.renderLocation()
        break;

      default:
        break;
    }

  }

  getCommunityEnergy() {
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
      //this.communityMonthChartLabels.push(item.month);
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

    console.log(totalExports, totalImports)

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

      const clickListener = this.cadastresMap.addListener('click', (event: google.maps.Data.MouseEvent) => {

        this.resetCadastre();

        let latLng: any = event.latLng;

        this.selectedCoords = { lat: latLng.lat(), lng: latLng.lng() }

        const feature = event.feature;

        //if selected is false, the click was to deselect, so you don't have to do anything else
        let isSelectedArea = feature.getProperty('selected')
        if (!isSelectedArea) {
          return;
        }

        let cadastre: any = feature.getProperty('localId')

        //check if selected area is an already added area
        let foundArea = this.addedAreas.find((addedArea) => addedArea.id == cadastre)
        if (foundArea) {
          console.log("found")
          this.selectedCadastre = foundArea;
          this.restoreCadastre();
          return;
        }

        this.selectedCadastre.feature = feature;
        this.selectedCadastre.id = cadastre;

        let areaM2: any = feature.getProperty('areaM2');
        this.selectedCadastre.m2 = Math.floor(areaM2);
        //this.selectedCadastre.n_plaques = Math.floor((this.selectedCadastre.m2! * 0.2) / 1.7) | 0;

        //this.updateCadastreConsumptionM2();
        //this.updateCadastreChart();
        //this.updateSelectedCadastreValoration();

      });

    }, error => {
      this.loading.next(false),
        Swal.fire({
          title: 'Error getting areas',
          icon: "error"
        })
    })

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

    console.log("updateCadastreConsumptionM2", updatedConsumption)

    this.selectedCadastre.valle = this.selectedCadastre.totalConsumption * 0.50;
    this.selectedCadastre.llano = this.selectedCadastre.totalConsumption * 0.26;
    this.selectedCadastre.punta = this.selectedCadastre.totalConsumption * 0.24;

    console.log("update consumption by m2", "valle:", this.selectedCadastre.valle, "llano:", this.selectedCadastre.llano, "punta:", this.selectedCadastre.punta, "total:", this.selectedCadastre.totalConsumption)
  }

  updateCadastreConsumption() {

    this.selectedCadastre.valle = Math.abs(this.selectedCadastre.valle)
    this.selectedCadastre.llano = Math.abs(this.selectedCadastre.llano)
    this.selectedCadastre.punta = Math.abs(this.selectedCadastre.punta)

    this.selectedCadastre.totalConsumption = this.selectedCadastre.valle + this.selectedCadastre.llano + this.selectedCadastre.punta

    this.selectedCadastre.valleMonthlyPrice = this.selectedCadastre.valle * this.selectedCadastre.vallePrice
    this.selectedCadastre.llanoMonthlyPrice = this.selectedCadastre.llano * this.selectedCadastre.llanoPrice
    this.selectedCadastre.puntaMonthlyPrice = this.selectedCadastre.punta * this.selectedCadastre.puntaPrice

    this.selectedCadastre.totalConsumptionPrice = this.selectedCadastre.valleMonthlyPrice + this.selectedCadastre.llanoMonthlyPrice + this.selectedCadastre.puntaMonthlyPrice

    console.log("total consumption", this.selectedCadastre.totalConsumption, " price ", this.selectedCadastre.totalConsumptionPrice)
    console.log(this.selectedCadastre.valleMonthlyPrice, this.selectedCadastre.llanoMonthlyPrice, this.selectedCadastre.puntaMonthlyPrice)

  }

  featureSelected(selectedFeature: any) { }

  updateSelectedCadastreValoration() {
    let consumption = this.selectedCadastre.yearConsumption!;
    let production = this.selectedCadastre.yearGeneration!;
    console.log("consumption:", consumption, " production:", production)
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
        label: 'Generació',
        data: this.selectedCadastre.monthsGeneration,
        backgroundColor: '#229954',
        borderColor: 'rgb(255,255,255)'
      }
    ]
    this.updateSelectedCadastreMonthChartSubject.next(true);
  }

  updateCadastreChart() {

    //console.log("generation", this.selectedCadastre.monthsGeneration)
    //console.log("surplus", this.selectedCadastre.monthsSurplus)
    //console.log("consumption", this.selectedCadastre.monthsConsumption)

    //calculateCadastreMonths();

    this.cdr.detectChanges();

    this.selectedCadastreMonthChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: this.selectedCadastre.monthsConsumption,
        backgroundColor: '#D35400',
        borderColor: 'rgb(255,255,255)'
      },
      {
        label: 'Generació (Kwh)',
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

    this.updateSelectedCadastreValoration()

  }

  changeShrinkState() {
    this.isShrunk = !this.isShrunk;
  }

  addArea() {
    console.log("added areas 1", this.addedAreas)
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
    console.log("added areas 2", this.addedAreas)
    this.resetCadastre();

  }

  deleteArea(index: number) {
    this.map.deleteArea(this.addedAreas[index])
    this.addedAreas.splice(index, 1);
    this.resetCadastre();
    this.updateCommunityChart();

  }

  unselectArea(feature: any) {
    this.map.unselectArea(feature)
    this.resetCadastre();
  }

  editArea(index: number) {
    console.log("edit area", this.addedAreas[index]);
    this.map.selectArea(this.addedAreas[index])
    this.selectedCadastre = this.addedAreas[index];
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

  calculateCCE() {

    console.log("CCE type data: ")

    //reset the value:
    this.selectedCadastre.monthsSurplus = [];
    let yearSurplus: number = 0;
    let yearConsumption: number = 0;
    let originalYearConsumption: number = 0;

    //get consumption and surplus
    this.selectedCadastre.monthsGeneration?.map((generation, index) => {

      let consumption: number = this.selectedCadastre.monthsConsumption![index]
      originalYearConsumption += consumption;

      if (generation > consumption) {

        let surplus = generation - consumption;

        this.selectedCadastre.monthsSurplus?.push(surplus)

        yearSurplus += surplus;

      } else { //no surplus

        this.selectedCadastre.monthsSurplus?.push(0);
        //this.selectedCadastre.monthsConsumption![index] = consumption;

      }

      yearConsumption += this.selectedCadastre.monthsConsumption![index]

    })

    let monthAverageSurplus = yearSurplus/12;

    //cost of a month with community prices:
    let averageMonthlyCosts = (yearConsumption / 12) * this.selectedCadastre.generationPrice!;
    //cost of a month without generation and with energy company prices:
    let originalAverageMonthlyCosts = (originalYearConsumption / 12) * this.selectedCadastre.llanoPrice;

    //monthlySavings, IN ACC, is the price of energy that you stop using from the company when you have generation
    //this.selectedCadastre.monthlySavings = monthlyConsumedProduction * this.selectedCadastre.llanoPrice;

    //monthlySavings, IN CCE, is the price of energy that you stop using from the company when you get it from generation tokens
    this.selectedCadastre.monthlySavings = originalAverageMonthlyCosts - averageMonthlyCosts;

    //average of monthly profits from surplus (sold to community participants)
    this.selectedCadastre.surplusMonthlyProfits = ((yearSurplus / 12) * this.selectedCadastre.generationPrice!);

    //average of monthly savings from getting energy from community

    //TODO: review monthly savings and redeem years and surplus

    console.log("savings",this.selectedCadastre.monthlySavings,"profits", this.selectedCadastre.surplusMonthlyProfits)
    console.log("year surplus: ", yearSurplus, ", month surplus", yearSurplus / 12)

    //TODO: temporal sum of savings and profits
    this.selectedCadastre.monthlySavings+=this.selectedCadastre.surplusMonthlyProfits!;

    this.selectedCadastre.monthlySavings=parseFloat(this.selectedCadastre.monthlySavings.toFixed(2))

    console.log("savings + profits : ",this.selectedCadastre.monthlySavings)

    //the redeem years are the profits earned month by month:
    this.selectedCadastre.redeemYears = Math.ceil(this.selectedCadastre.totalCost! / (12 * (this.selectedCadastre.monthlySavings!)));

  }

  /** Obtains the price of average month
   *  calculates the excedent energy price, the consumption saving price and the years to amortize the investment.
   *
   */
  calculateMonthlySavings() {

    console.log("calculate monthly savings. Active Acc", this.activeAcc, "Active Cce", this.activeCce);

    let monthAverageGeneration: number = this.selectedCadastre.yearGeneration! / 12;
    let monthAverageConsumption: number = this.selectedCadastre.yearConsumption! / 12;
    let monthlyConsumedProduction: number = 0;
    let monthlyCosts = monthAverageConsumption * this.selectedCadastre.llanoPrice;
    let communityMonthlyCosts:number;

    if (monthAverageGeneration > monthAverageConsumption) {

      //surplus is the generation minus consumption, if generation is greater than consumption
      let monthAverageSurplus: number = monthAverageGeneration - monthAverageConsumption;

      //monthlyConsumedProduction is the production directly used by the customer
      monthlyConsumedProduction = monthAverageGeneration - monthAverageSurplus;

      //surplusMonthlyProfits is the price of excedent from generation that is sold to the company or to community
      this.selectedCadastre.surplusMonthlyProfits = monthAverageSurplus * this.selectedCadastre.generationPrice!;

      monthAverageConsumption=0;

    } else {

      //monthlyConsumedProduction is the production directly used by the customer
      monthlyConsumedProduction = monthAverageGeneration;

      //update consuption considering generation:
      monthAverageConsumption = monthAverageConsumption - monthAverageGeneration;

      this.selectedCadastre.surplusMonthlyProfits = 0;

    }

    console.log("Average consumption",monthAverageConsumption,"llano price", this.selectedCadastre.llanoPrice, "generation price", this.selectedCadastre.generationPrice)

    if(this.activeAcc){
      communityMonthlyCosts = monthAverageConsumption * this.selectedCadastre.llanoPrice;
      //monthlySavings is the price of energy that you stop using from the company when you have generation
      this.selectedCadastre.monthlySavings = monthlyCosts - communityMonthlyCosts//monthlyConsumedProduction * this.selectedCadastre.llanoPrice;
      console.log("selectedCadastre.monthlySavings, monthlyConsumedProduction",this.selectedCadastre.monthlySavings, monthlyConsumedProduction)
    }

    if(this.activeCce){
      communityMonthlyCosts = monthAverageConsumption * this.selectedCadastre.generationPrice!;
      //monthlySavings is the price of energy that you stop using from the company when you have generation
      this.selectedCadastre.monthlySavings = monthlyCosts - communityMonthlyCosts //monthlyConsumedProduction * this.selectedCadastre.generationPrice!;
      console.log("selectedCadastre.monthlySavings, monthlyConsumedProduction",this.selectedCadastre.monthlySavings, monthlyConsumedProduction)
    }

    //TODO: temporal sum of savings and profits
    this.selectedCadastre.monthlySavings!+=this.selectedCadastre.surplusMonthlyProfits!;

    console.log("this.selectedCadastre.surplusMonthlyProfits",this.selectedCadastre.surplusMonthlyProfits)

    //in acc, the savings cannot overcome the costs
    if(this.activeAcc && this.selectedCadastre.monthlySavings! > monthlyCosts!){
      console.log("this.selectedCadastre.monthlySavings!, monthlyCosts!",this.selectedCadastre.monthlySavings!, monthlyCosts!)
      this.selectedCadastre.monthlySavings = monthlyCosts!;
    }

    this.selectedCadastre.monthlySavings=parseFloat(this.selectedCadastre.monthlySavings!.toFixed(2))

    console.log("this.selectedCadastre.monthlySavings",this.selectedCadastre.monthlySavings)

    //the redeem years are the profits earned month by month:
    this.selectedCadastre.redeemYears = Math.ceil(this.selectedCadastre.totalCost! / (12 * (this.selectedCadastre.monthlySavings!)));

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

      this.showLoading()

      try {
        await this.calculateSolarParams()
      } catch (error) {
        this.loading.next(false);
        Swal.fire('Error', 'Error calculant la simulació', 'error')
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

  setMobileStatus(sizePx: number){
    return sizePx < 768;
  }

  setMobileDesktopOptions(){
    this.communityMonthChartOptions =
      {
        interaction: {
          intersect: false,
          mode: 'index',
        },
        indexAxis: this.isMobile ? 'y' : 'x',
        aspectRatio: this.isMobile ? 1.1 : 1.5,
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
  }
}

//todo: refresh chart when deleting 'membres simulats'
