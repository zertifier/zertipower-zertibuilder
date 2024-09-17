import { Component, ViewChild, AfterViewInit, ElementRef, OnInit } from "@angular/core";
import Chart from 'chart.js/auto';
import { CustomersApiService } from "../../customers/customers.service";
import { EnergyService } from "../../../core/core-services/energy.service";
import { CustomersService } from "../../../core/core-services/customers.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import moment from "moment";
import { log } from "console";
import { DatadisEnergyService } from "src/app/core/core-services/datadis-energy.service";
import { BehaviorSubject } from "rxjs";
import Swal from "sweetalert2";
import 'moment/locale/ca';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {

  customers: any;
  customersSelectorListener: any;
  selectedCupsCustomer: any;
  dateSelectorListener: any;
  year!: number;
  date!: string;
  unformattedDate: Date = new Date();
  month!: string;
  cupsId!: number;

  simpleWeekDateInit: string = '';
  simpleWeekDateEnd: string = '';

  originDataTypes: string[] = ['Datadis', 'Inverter', 'Smart meter', 'Sensor', 'Other']
  selectedCupsOriginDataType: string = 'Datadis';

  // Year chart variables
  yearChartType: string = 'pie';
  yearChartLabels: string[] = [];
  yearChartDatasets: any[] | undefined = undefined;
  yearChartData: any[] = [];
  yearChartBackgroundColor: string[] = [];
  updateYearChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Months chart variables
  monthsChartType: string = 'bar';
  monthsChartLabels: string[] = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  monthsChartDatasets: any[] | undefined = undefined;
  monthsChartData: any[] = [];
  monthsChartBackgroundColor: string[] = [];
  updateMonthsChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Month chart variables:
  monthChartType: string = 'bar';
  monthChartLabels: string[] = [] //['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

  monthChartDatasets: any[] | undefined = undefined;
  monthChartData: any[] = [];
  monthChartBackgroundColor: string[] = [];
  updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  //day chart variables:
  dayChartType: string = 'bar';
  dayChartLabels: string[] = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
  dayChartDatasets: any[] | undefined = undefined;
  dayChartData: any[] = [];
  dayChartBackgroundColor: string[] = [];
  updateDayChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  constructor(private energyService: EnergyService, private customersService: CustomersService, private fb: FormBuilder, private datadisEnergyService: DatadisEnergyService) { }

  ngOnInit() {
    //set catalan languaje in moment library:
    moment.locale('ca');
    //get date, week and year:
    let newDate = new Date();
    if (!this.date) {
      this.date = this.date || `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}`;
    }
    this.month = moment(this.date, 'DD/MM/YYYY').format('MMMM');
    this.year = this.year || new Date().getFullYear();
  }

  ngAfterViewInit(): void {

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data;
      //set default value to selected cups:
      this.cupsId = this.customers[0].id
      //get chart info:
      let { yearEnergy, monthEnergy, dayEnergy } = await this.getChartInfo(this.cupsId, this.year, this.date)
      //update charts:
      this.updateCharts(yearEnergy, monthEnergy, dayEnergy)
    })

    //customer selector listener
    this.customersSelectorListener = document.getElementById('customerSelector')!.addEventListener('change', async (event: any) => {
      this.cupsId = this.selectedCupsCustomer.id;
      this.getOriginData();
      //get chart info:
      let { yearEnergy, monthEnergy, dayEnergy } = await this.getChartInfo(this.cupsId, this.year, this.date)
      //update charts:
      this.updateCharts(yearEnergy, monthEnergy, dayEnergy)
    })

    //date selector listener
    this.dateSelectorListener = document.getElementById('daySelector')!.addEventListener('change', async (event: any) => {
      if (!this.cupsId) {
        Swal.fire("Cap usuari seleccionat", "Selecciona un usuari", "info")
        return;
      }
      this.unformattedDate = new Date(event.target.value);
      this.date = `${this.unformattedDate.getDate()}/${this.unformattedDate.getMonth() + 1}/${this.unformattedDate.getFullYear()}`;
      this.year = new Date(this.unformattedDate).getFullYear()
      //get chart info:
      let { yearEnergy, monthEnergy, dayEnergy } = await this.getChartInfo(this.cupsId, this.year, this.date)
      //update charts:
      this.updateCharts(yearEnergy, monthEnergy, dayEnergy)
    })
  }

  getOriginData() {
    if (this.selectedCupsCustomer.datadis_active) {
      this.selectedCupsOriginDataType = 'Datadis';
    } else if (this.selectedCupsCustomer.inverter_active) {
      this.selectedCupsOriginDataType = 'Inverter';
    } else if (this.selectedCupsCustomer.smart_meter_active) {
      this.selectedCupsOriginDataType = 'Smart meter';
    } else {
      this.selectedCupsOriginDataType = 'Other';
    }
  }

  async updateCharts(yearEnergy: any, monthEnergy: any, dayEnergy: any) {
    this.updateYearChartF(yearEnergy)
    this.updateMonthlyChart(yearEnergy)
    this.updateMonthChart(monthEnergy)
    this.updateHourlyChart(dayEnergy)
  };

  async getChartInfo(cupsId: number, year: number, date: string) {
    let yearEnergy = await this.getYearEnergy(cupsId, year)
    let monthEnergy = await this.getEnergyByMonth(cupsId, date)
    let dayEnergy = await this.getEnergyByDay(cupsId, date)
    return { yearEnergy, monthEnergy, dayEnergy }
  }

  getYearEnergy(cups: number, year: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getYearByCups(year, 'datadis', cups!).subscribe((res: any) => {
        let monthlyCupsData = res.data.stats;
        let months: string[] = monthlyCupsData.map((entry: any) => moment(entry.info_dt).format('MMMM'));
        //let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.kwhIn);
        let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.production);
        let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.kwhOut);
        let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.kwhIn);
        let yearEnergy = { months, kwhConsumption, kwhGeneration, kwhExport }
        resolve(yearEnergy)
      })
    })
  }

  getEnergyByMonth(cups: number, date: string): Promise<any> {
    date = moment(date, 'D/M/YYYY').format('YYYY-MM')
    return new Promise((resolve, reject) => {
      this.energyService.getMonthByCups(date, 'datadis', cups!).subscribe((res: any) => {
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

  getEnergyByDay(cups: number, date: string): Promise<any> {
    date = moment(date, 'DD/MM/yyyy').format('YYYY-MM-DD')
    return new Promise((resolve, reject) => {
      this.energyService.getDayByCups(cups,'datadis',date).subscribe((res: any) => {
        let hourlyData = res.data.stats;
        let hours = hourlyData.map((entry: any) => moment(entry.infoDt).format('HH:mm'));
        //let dayImport = hourlyData.map((entry: any) => entry.import);
        let dayGeneration = hourlyData.map((entry: any) => entry.production);
        let dayConsumption = hourlyData.map((entry: any) => entry.kwhIn);
        let dayExport = hourlyData.map((entry: any) => entry.kwhOut);
        let dayEnergy = { hours, dayGeneration, dayConsumption, dayExport } //dayImport
        resolve(dayEnergy)
      })
    }
    )
  }

  updateYearChartF(yearEnergy: any) {

    //const sumImport = yearEnergy.kwhImport.length > 0 ? yearEnergy.kwhImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0) : 0;
    const sumGeneration = yearEnergy.kwhGeneration.length > 0 ? yearEnergy.kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0) : 0;
    const sumConsumption = yearEnergy.kwhConsumption.length > 0 ? yearEnergy.kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0) : 0;
    const sumExport = yearEnergy.kwhExport.length > 0 ? yearEnergy.kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0) : 0;

    this.yearChartLabels = ['Consumption (Kwh)', 'Generation (Kwh)', 'Export (Kwh)'] //'Import (Kwh)'

    this.yearChartDatasets = [{
      data: [sumConsumption, sumGeneration, sumExport], //sumImport
      backgroundColor: [
        //'rgb(255, 99, 132)',
        '#D35400',
        '#229954',
        '#3498DB',
      ]
    }]

    this.updateYearChartSubject.next(true);

  }

  updateMonthlyChart(yearEnergy: any) {

    this.monthChartLabels = yearEnergy.months

    this.monthsChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: yearEnergy.kwhConsumption,
        backgroundColor: '#D35400'
      },
      {
        label: 'Generació (Kwh)',
        data: yearEnergy.kwhGeneration,
        backgroundColor: '#229954'
      },
      {
        label: 'Exportació (Kwh)',
        data: yearEnergy.kwhExport,
        backgroundColor: '#3498DB'
      },
    ]

    this.updateMonthsChartSubject.next(true);
  }

  updateMonthChart(monthEnergy: any) {

    this.monthChartLabels = monthEnergy.monthDays
    this.monthChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: monthEnergy.monthConsumption,
        backgroundColor: '#D35400'
      }, {
        label: 'Generació (Kwh)',
        data: monthEnergy.monthGeneration,
        backgroundColor: '#229954'
      }, {
        label: 'Exportació (Kwh)',
        data: monthEnergy.monthExport,
        backgroundColor: '#3498DB'
      }]

    this.updateMonthChartSubject.next(true);

  }

  updateHourlyChart(dayEnergy: any) {

    this.dayChartDatasets = [
      {
        label: 'Consum (Kwh)',
        data: dayEnergy.dayConsumption,
        backgroundColor: '#D35400'
      },
      {
        label: 'Generació (Kwh)',
        data: dayEnergy.dayGeneration,
        backgroundColor: '#229954'
      },
      {
        label: 'Exportació (Kwh)',
        data: dayEnergy.dayExport,
        backgroundColor: '#3498DB'
      }
    ]

    this.updateDayChartSubject.next(true);

  }
}

// updateWeekDateLimits(week: number, weekDateLimits: any) {
//   let weekDateInit = new Date(weekDateLimits[0]);
//   let weekDateEnd = new Date(weekDateLimits[1]);
//   this.simpleWeekDateInit = `${weekDateInit.getFullYear()}/${weekDateInit.getMonth() + 1}/${weekDateInit.getDate()}`
//   this.simpleWeekDateInit = moment(this.simpleWeekDateInit).format('DD/MM/YYYY')
//   this.simpleWeekDateEnd = `${weekDateEnd.getFullYear()}/${weekDateEnd.getMonth() + 1}/${weekDateEnd.getDate()}`
//   this.simpleWeekDateEnd = moment(this.simpleWeekDateEnd).format('DD/MM/YYYY')
// }

// getWeekNumber(date: Date) {
//   // Clona el objeto de fecha para evitar modificaciones no deseadas
//   let clonedDate: any = new Date(date);

//   // Ajusta el día al jueves de la semana actual
//   clonedDate.setDate(clonedDate.getDate() + 4 - (clonedDate.getDay() || 7));

//   // Obtiene la fecha del primer día del año
//   let yearStart: any = new Date(clonedDate.getFullYear(), 0, 1);

//   // Calcula el número de días transcurridos desde el primer día del año
//   let days = Math.floor((clonedDate - yearStart) / 86400000);

//   // Calcula el número de la semana (semanas completas más una semana adicional si el resto de días es mayor a 3)
//   let weekNumber = Math.ceil((days + 1) / 7);

//   return weekNumber;
// }