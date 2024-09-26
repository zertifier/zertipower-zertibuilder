import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { BehaviorSubject, Observable, repeat, Subject, take } from 'rxjs';
import { CommunitiesApiService } from '../communities.service';
import moment from 'moment';
import { CustomersService } from "../../../core/core-services/customers.service";
import { EnergyService } from "../../../core/core-services/energy.service";
import Chart from "chart.js/auto";
import { CupsInterface, CupsApiService } from "../../cups/cups.service";
import { LocationService } from 'src/app/core/core-services/location.service';
import { AppMapComponent } from 'src/app/shared/infrastructure/components/map/map.component';

@Component({
  selector: 'communities-form',
  templateUrl: './communities-form.component.html',
  styleUrls: ['./communities-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CommunitiesFormComponent implements OnInit {

  @ViewChild('yearChart') yearChart: any;

  id: number = 0;
  communityId: number | any;
  community: any = {};
  customers: any;
  allCups: any;
  communityCups: any[] = [];
  selectedTab: string = 'monthly';
  test: number = 1;

  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    name: new FormControl<string | null>(null),
    tradeType: new FormControl<string | null>(null),
    locationId: new FormControl<number | null>(null),
    lat: new FormControl<Number | null>(null),
    lng: new FormControl<number | null>(null),
    test: new FormControl<number | null>(null),
    createdAt: new FormControl<string | null>(null),
    updatedAt: new FormControl<string | null>(null),
  });

  selectedYear = new Date().getFullYear();
  selectedMonth = moment().format("YYYY-MM")
  selectedDate: any = moment().subtract(1, 'days').format("YYYY-MM-DD");

  yearChartType: string = 'bar';
  yearChartLabels: string[] = [];
  yearChartDatasets: any[] = [];
  yearChartData: number[] = [];
  yearChartBackgroundColor: string[] = [];
  updateYearChart: boolean = false;
  updateYearChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  monthChartType: string = 'bar';
  monthChartLabels: string[] = [];
  monthChartDatasets: any[] = [];
  monthChartData: any[] = [];
  monthChartBackgroundColor: string[] = [];
  updateMonthChart: boolean = false;
  updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  dayChartType: string = 'bar';
  dayChartLabels: string[] = [];
  dayChartDatasets: any[] = [];
  dayChartData: any[] = [];
  dayChartBackgroundColor: string[] = [];
  updateDayChart: boolean = false;
  updateDayChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  locations: any[] = [];
  @ViewChild(AppMapComponent) map!: AppMapComponent;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CommunitiesApiService,
    private activeModal: NgbActiveModal,
    private customersService: CustomersService,
    private energyService: EnergyService,
    private cdr: ChangeDetectorRef,
    private cupsApiService: CupsApiService,
    private locationService: LocationService
  ) {
    moment.locale('ca');
  }

  async ngOnInit() {
    if (!this.id) {
      this.getInfo();
    }
  }

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id)
      .pipe(take(1))
      .subscribe((data) => {

        this.community = data;
        this.form.controls.id.setValue(data.id);
        this.communityId = data.id;
        this.form.controls.name.setValue(data.name);
        this.form.controls.tradeType.setValue(data.tradeType);
        this.form.controls.locationId.setValue(data.locationId);
        this.form.controls.lat.setValue(data.lat);
        this.form.controls.lng.setValue(data.lng);
        this.form.controls.test.setValue(data.test);
        this.test = data.test;
        this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
        this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));

        this.getInfo();

      });
  }

  getInfo() {
    this.customersService.getCustomersCups()
      .pipe(take(1))
      .subscribe(async (res: any) => {
        this.allCups = res.data;
        //get the cups that doesnt own to other communities
        this.customers = this.allCups.filter((cups: any) =>
          cups.community_id == this.id || cups.community_id == null || cups.community_id == 0
        )
        if (!this.communityId) {
          return;
        }
        //get the cups that own to the selected community
        this.communityCups = this.customers.filter((cups: any) =>
          cups.community_id == this.id
        )
        this.updateData();
        // notify changes to ng-select
        this.cdr.detectChanges();
      })
    this.locationService.getLocations()
      .pipe(take(1))
      .subscribe(async (res: any) => {
        this.locations = res.data;
        if (this.community.locationId) {
          this.setMapLocationByLocationId(this.community.locationId)
          if (this.community.lat && this.community.lng) {
            this.setMarker(this.community.lat, this.community.lng)
          } else {
            console.log("Community haven't latlng")
          }
        } else {
          console.log("Community haven't location id")
        }
      })
  }

  setMarker(lat: number, lng: number) {
    let marker = this.map.addMarker(lat, lng)
  }

  changeDay() {
    this.getDayEnergy();
  }

  changeMonth() {
    this.getMonthEnergy();
  }

  changeYear() {
    // this.getYearEnergy();
    this.getMonthsEnergy()
  }

  updateData() {
    switch (this.selectedTab) {
      case 'yearly':
        this.getMonthsEnergy();
        break;
      case 'monthly':
        this.getMonthEnergy();
        break;
      case 'daily':
        this.getDayEnergy();
        break;
      default:
        console.log("Update data case default selected tab: ", this.selectedTab)
    }
  }

  async getMonthEnergy() {

    let monthDays: string[] = []
    let monthEnergyData: any;

    monthEnergyData = await this.getMonthEnergyByCommunity(this.communityId, this.selectedMonth);

    let labels = monthEnergyData.monthDays;
    let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    let chartData = [monthEnergyData.monthConsumption, monthEnergyData.monthGeneration, monthEnergyData.monthExport]
    let chartColors = [
      '#D35400',
      '#229954',
      '#3498DB',
    ]

    this.updateMonthChartValues(labels, dataLabels, chartData, chartColors)

    // // Arrays to store accumulated energies
    // let sumMonthConsumption: number[] = [];
    // let sumMonthGeneration: number[] = [];
    // let sumMonthExport: number[] = [];

    // // Array to store data for all cups
    // let monthEnergyData: any[] = [];

    // // Fetch data for all cups concurrently
    // const energyPromises = this.communityCups.map(async (cup) => {
    //   return await this.getMonthEnergyByCups(cup.id, this.selectedMonth);
    // });

    // // Wait for all promises to resolve
    // try {
    //   monthEnergyData = await Promise.all(energyPromises);
    // } catch (error) {
    //   console.error("Error fetching month energy:", error);
    //   return;
    // }

    // // Accumulate consumption across all cups
    // monthEnergyData.forEach(data => {

    //   data.monthDays.forEach((day: string, index: number) => {
    //     if (!monthDays[index]) {
    //       monthDays.push(day)
    //       sumMonthConsumption.push(0)
    //       sumMonthGeneration.push(0)
    //       sumMonthExport.push(0)
    //     }
    //   })

    //   data.monthConsumption.forEach((consumptionValue: number, index: number) => {
    //     sumMonthConsumption[index] += Number(consumptionValue) || 0;
    //   });
    // });

    // // Accumulate export across all cups
    // monthEnergyData.forEach(data => {
    //   data.monthExport.forEach((exportValue: number, index: number) => {
    //     sumMonthExport[index] += Number(exportValue) || 0;
    //   });
    // });

    // // Accumulate generation across all cups
    // monthEnergyData.forEach(data => {
    //   data.monthGeneration.forEach((generationValue: number, index: number) => {
    //     sumMonthGeneration[index] += Number(generationValue) || 0;
    //   });
    // });

    // let labels = monthDays;
    // let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    // let chartData = [sumMonthConsumption, sumMonthGeneration, sumMonthExport]
    // let chartColors = [
    //   '#D35400',
    //   '#229954',
    //   '#3498DB',
    // ]

    // this.updateMonthChartValues(labels, dataLabels, chartData, chartColors)
  }

  async getMonthsEnergy() {

    let yearEnergyData: any;

    yearEnergyData = await this.getYearEnergyByCommunity(this.communityId, this.selectedYear);

    let labels = yearEnergyData.months;
    let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    let chartData = [yearEnergyData.kwhConsumption,
    yearEnergyData.kwhGeneration,
    yearEnergyData.kwhExport]
    let chartColors = [
      '#D35400',
      '#229954',
      '#3498DB',
    ]

    this.updateMonthsChartValues(labels, dataLabels, chartData, chartColors)

    // let monthDays: string[] = []
    // let sumMonthsGeneration = Array.apply(null, Array(12)).map(function () {
    //   return 0
    // });
    // let sumMonthsConsumption = Array.apply(null, Array(12)).map(function () {
    //   return 0;
    // });
    // let sumMonthsExport = Array.apply(null, Array(12)).map(function () {
    //   return 0;
    // });

    // //todo: getEnergyByCommunity

    // const getAllEnergy = this.communityCups.map(async (cups: any) => {
    //   //get energy by cups
    //   let yearEnergy: any = await this.getYearEnergyByCups(cups.id, this.selectedYear);

    //   cups.yearEnergy = yearEnergy;
    //   cups.yearEnergy.factor = 0;

    //   //create sum of month energy cups:

    //   sumMonthsExport = sumMonthsExport.map((monthExport, index) => {
    //     monthExport += Number(yearEnergy.kwhExport[index]) || 0;
    //     return monthExport;
    //   })
    //   sumMonthsGeneration = sumMonthsGeneration.map((monthGeneration, index) => {
    //     monthGeneration += Number(yearEnergy.kwhGeneration[index]) || 0;
    //     return monthGeneration;
    //   })
    //   sumMonthsConsumption = sumMonthsConsumption.map((monthConsumption, index) => {
    //     monthConsumption += Number(yearEnergy.kwhConsumption[index]) || 0
    //     return monthConsumption;
    //   })

    // })

    // await Promise.all(getAllEnergy)

    // let labels = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
    // let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    // let chartData = [sumMonthsConsumption, sumMonthsGeneration, sumMonthsExport]
    // let chartColors = [
    //   '#D35400',
    //   '#229954',
    //   '#3498DB',
    // ]

    // this.updateMonthsChartValues(labels, dataLabels, chartData, chartColors);
  }

  async getDayEnergy() {

    let yearEnergyData: any;

    yearEnergyData = await this.getDayEnergyByCommunity(this.communityId, this.selectedDate);

    let labels = yearEnergyData.hours;
    let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    let chartData = [yearEnergyData.kwhConsumption,
    yearEnergyData.kwhGeneration,
    yearEnergyData.kwhExport]
    let chartColors = [
      '#D35400',
      '#229954',
      '#3498DB',
    ]

    this.updateDayChartValues(labels, dataLabels, chartData, chartColors)


    // let sumDayGeneration = Array.apply(null, Array(24)).map(function () {
    //   return 0
    // });
    // let sumDayConsumption = Array.apply(null, Array(24)).map(function () {
    //   return 0;
    // });
    // let sumDayExport = Array.apply(null, Array(24)).map(function () {
    //   return 0;
    // });

    // //todo: getEnergyByCommunity

    // const getAllEnergy = this.communityCups.map(async (cups: any) => {
    //   //get energy by cups
    //   let dayEnergy = await this.getDayEnergyByCups(cups.id, this.selectedDate);

    //   cups.dayEnergy = dayEnergy;

    //   sumDayExport = sumDayExport.map((dayExport, index) => {
    //     dayExport += Number(dayEnergy.kwhExport[index]) || 0;
    //     return dayExport;
    //   })
    //   sumDayGeneration = sumDayGeneration.map((dayGeneration, index) => {
    //     dayGeneration += Number(dayEnergy.kwhGeneration[index]) || 0;
    //     return dayGeneration;
    //   })
    //   sumDayConsumption = sumDayConsumption.map((dayConsumption, index) => {
    //     dayConsumption += Number(dayEnergy.kwhConsumption[index]) || 0;
    //     return dayConsumption;
    //   })
    // })

    // await Promise.all(getAllEnergy)

    // let labels = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
    // let dataLabels = ['Consum (kWh)', 'Generació (kWh)', 'Excedent (kWh)']
    // let chartData = [sumDayConsumption, sumDayGeneration, sumDayExport]
    // let chartColors = [
    //   '#D35400',
    //   '#229954',
    //   '#3498DB',
    // ]

    // this.updateDayChartValues(labels, dataLabels, chartData, chartColors)

  }

  //update charts functions (daily, monthly, yearly):

  updateDayChartValues(labels: any[], dataLabels: string[], data: any[], colors: any[]) {
    this.dayChartLabels = labels;
    this.dayChartDatasets = Array.apply(null, Array(data.length))
      .map(function () { return { label: '', data: [], backgroundColor: '' } });
    data.forEach((element, index) => {
      this.dayChartDatasets[index].label = dataLabels[index];
      this.dayChartDatasets[index].data = element;
      this.dayChartDatasets[index].backgroundColor = colors[index]
    })
    this.updateDayChartSubject.next(true);
  }

  updateMonthChartValues(labels: any[], dataLabels: string[], data: any[], colors: any[]) {
    this.monthChartLabels = labels;
    this.monthChartDatasets = Array.apply(null, Array(data.length))
      .map(function () { return { label: '', data: [], backgroundColor: '' } });
    data.forEach((element, index) => {
      this.monthChartDatasets[index].label = dataLabels[index];
      this.monthChartDatasets[index].data = element;
      this.monthChartDatasets[index].backgroundColor = colors[index]
    })

    this.updateMonthChartSubject.next(true);
  }

  updateMonthsChartValues(labels: any[], dataLabels: string[], data: any[], colors: any[]) {
    this.yearChartLabels = labels;
    this.yearChartDatasets = Array.apply(null, Array(data.length))
      .map(function () { return { label: '', data: [], backgroundColor: '' } });
    data.forEach((element, index) => {
      this.yearChartDatasets[index].label = dataLabels[index];
      this.yearChartDatasets[index].data = element;
      this.yearChartDatasets[index].backgroundColor = colors[index]
    })

    this.updateYearChartSubject.next(true);
  }


  //energy service requests ( daily, monthly, yearly)

  getDayEnergyByCups(cups: number, date: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getDayByCups(cups, 'datadis', this.selectedDate)
        .pipe(take(1))
        .subscribe((res: any) => {
          let hourlyData = res.data.stats
          let hours = hourlyData.map((entry: any) => moment.utc(entry.infoDt).format('HH'));
          let kwhGeneration = hourlyData.map((entry: any) => entry.production);
          let kwhConsumption = hourlyData.map((entry: any) => entry.kwhIn);
          let kwhExport = hourlyData.map((entry: any) => entry.kwhOut);
          let dayEnergy = { hours, kwhGeneration, kwhConsumption, kwhExport }
          resolve(dayEnergy)
        })
    }
    )
  }

  getMonthEnergyByCups(cups: number, date: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getMonthByCups(this.selectedMonth, 'datadis', cups!)
        .pipe(take(1))
        .subscribe((res: any) => {
          let monthCupsData = res.data.stats;
          let monthDays = monthCupsData.map((entry: any) => moment(entry.infoDt).format('DD/MM/YYYY'));
          // let weekImport = weekCupsData.map((entry: any) => entry.import);
          let monthGeneration = monthCupsData.map((entry: any) => entry.production);
          let monthConsumption = monthCupsData.map((entry: any) => entry.kwhIn);
          let monthExport = monthCupsData.map((entry: any) => entry.kwhOut);
          let monthEnergy = { monthDays, monthGeneration, monthConsumption, monthExport, } // weekImport, weekDateLimits
          resolve(monthEnergy)
        })
    })
  }

  getYearEnergyByCups(cups: number, year: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getYearByCups(year, 'datadis', cups!)
        .pipe(take(1))
        .subscribe((res: any) => {

          let monthlyCupsData = res.data.stats;

          let months: string[] = monthlyCupsData.map((entry: any) => {
            entry.infoDt = moment(entry.infoDt).format('MMMM')
          }

          );
          let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.kwhIn);
          let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.production);
          let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.kwhOut);

          let sumImport = kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
          const sumGeneration = kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
          const sumExport = kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);

          let yearEnergy = {
            months,
            kwhGeneration,
            kwhConsumption,
            kwhExport,
            sumImport,
            sumGeneration,
            sumExport
          }
          resolve(yearEnergy)
        })
    })
  }

  //energy service requests ( daily, monthly, yearly)
  getDayEnergyByCommunity(cups: number, date: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getDayByCommunityCups(cups, 'datadis', this.selectedDate)
        .pipe(take(1))
        .subscribe((res: any) => {
          let hourlyData = res.data.stats
          let hours = hourlyData.map((entry: any) => moment.utc(entry.infoDt).format('HH'));
          let kwhGeneration = hourlyData.map((entry: any) => entry.production);
          let kwhConsumption = hourlyData.map((entry: any) => entry.kwhIn);
          let kwhExport = hourlyData.map((entry: any) => entry.kwhOut);
          let dayEnergy = { hours, kwhGeneration, kwhConsumption, kwhExport }
          resolve(dayEnergy)
        })
    }
    )
  }

  getMonthEnergyByCommunity(cups: number, date: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getMonthCommunityByCups(this.selectedMonth, 'datadis', cups!)
        .pipe(take(1))
        .subscribe((res: any) => {
          let monthCupsData = res.data.stats;
          let monthDays = monthCupsData.map((entry: any) => moment(entry.infoDt).format('DD/MM/YYYY'));
          // let weekImport = weekCupsData.map((entry: any) => entry.import);
          let monthGeneration = monthCupsData.map((entry: any) => entry.production);
          let monthConsumption = monthCupsData.map((entry: any) => entry.kwhIn);
          let monthExport = monthCupsData.map((entry: any) => entry.kwhOut);
          let monthEnergy = { monthDays, monthGeneration, monthConsumption, monthExport } // weekImport, weekDateLimits
          resolve(monthEnergy)
        })
    })
  }

  getYearEnergyByCommunity(cups: number, year: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getYearByCommunityCups(year, 'datadis', cups!)
        .pipe(take(1))
        .subscribe((res: any) => {

          let monthlyCupsData = res.data.stats;

          let months: string[] = monthlyCupsData.map((entry: any) => {
            let infoDt = moment(entry.infoDt).format('MM')
            return moment(infoDt).format('MMMM')
          }

          );
          let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.kwhIn);
          let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.production);
          let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.kwhOut);

          let sumImport = kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
          const sumGeneration = kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
          const sumExport = kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);

          let yearEnergy = {
            months,
            kwhGeneration,
            kwhConsumption,
            kwhExport,
            sumImport,
            sumGeneration,
            sumExport
          }
          resolve(yearEnergy)
        })
    })
  }


  updateMapLocation() {
    this.community.locationId = parseInt(this.form.value.locationId?.toString() || '0');
    this.setMapLocationByLocationId(this.community.locationId);
  }

  setMapLocationByLocationId(locationId: number) {
    let selectedLocation = this.locations.find(location => location.id == this.community.locationId)
    if (!selectedLocation) {
      console.log("Selected location not found")
      return;
    }
    this.map.centerToAddress(`${selectedLocation.municipality}, España`)
  }

  updateLatLng(latLngObject: any) {
    this.community.lat = latLngObject.lat
    this.community.lng = latLngObject.lng
    this.form.controls.lat.setValue(latLngObject.lat);
    this.form.controls.lng.setValue(latLngObject.lng);
  }

  //save comunnity changes:

  async save() {

    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Form not valid'
      });
      return;
    }

    let confirm = await Swal.fire({
      icon: 'info',
      title: `Els canvis s'aplicaràn a la comunitat`,
      showCancelButton: true,
      confirmButtonText: "Aplicar canvis",
      cancelButtonText: "Cancel·lar",
    })

    if (!confirm.isConfirmed) {
      return;
    }

    const values = this.getValues();

    let request: Observable<any>;

    if (!this.id) {
      delete values.id;
      delete values.updatedAt;
      delete values.createdAt;
      request = this.apiService.save(values)
    } else {
      request = this.apiService.update(this.id, values);
    }

    request
      .pipe(take(1))
      .subscribe((res) => {

        //res id is community id
        this.communityCups.map((cups: CupsInterface) => {

          cups.communityId = res.id | this.communityId;

          let cupsToUpdate: any = {
            id: cups.id,
            cups: cups.cups,
            providerId: cups.providerId,
            communityId: cups.communityId,
            locationId: cups.locationId,
            customerId: cups.customerId
          }

          this.cupsApiService.update(cups.id, cupsToUpdate)
            .pipe(take(1))
            .subscribe((res) => {
            })
        })

        //delete community id from cups that dont pertain to community anymore:
        if (this.communityCups.length) {
          this.allCups.map((cups: any) => {

            // if cups contains the community id but dont includes in community cups, delete it:
            if (cups.community_id == this.communityId) {

              let found = this.communityCups.find(cc =>
                cc.id == cups.id
              )

              if (!found) {

                let cupsToUpdate: any = {
                  id: cups.id,
                  cups: cups.cups,
                  providerId: cups.provider_id,
                  communityId: 0,
                  locationId: cups.location_id,
                  customerId: cups.customer_id
                }

                this.cupsApiService.update(cups.id, cupsToUpdate)
                  .pipe(take(1))
                  .subscribe((res) => {
                  })
              }

            }

          })
        }

        Swal.fire({
          icon: 'success',
          title: `L'operació s'ha completat amb èxit.`
        });
        this.activeModal.close();
      });
  }

  //exit from modal

  cancel() {
    this.activeModal.dismiss();
  }

  //obtain form values

  getValues(): any {
    const values: any = {};
    values.id = this.form.value.id;
    values.name = this.form.value.name;
    values.test = parseInt(this.form.value.test?.toString() || '0');
    values.locationId = parseInt(this.form.value.locationId?.toString() || '0');
    values.lat = Number(this.form.value.lat?.toString() || '0');
    values.lng = Number(this.form.value.lng?.toString() || '0');
    values.tradeType = this.form.value.tradeType;
    values.createdAt = this.form.value.createdAt;
    values.updatedAt = this.form.value.updatedAt;
    return values;
  }

  protected readonly undefined = undefined;

}
