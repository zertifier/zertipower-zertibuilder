import {Component, ViewChild, AfterViewInit, ElementRef, OnInit} from "@angular/core";
import Chart from 'chart.js/auto';
import {CustomersApiService} from "../../customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy.service";
import {CustomersService} from "../../../core/core-services/customers.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import moment from "moment";
import { log } from "console";
import { DatadisEnergyService } from "src/app/core/core-services/datadis-energy.service";

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('yearChart') yearChart: any;

  yearlyChartCanvas: any;
  monthlyChartCanvas: any;
  weeklyChartCanvas: any;
  hourlyChartCanvas: any;

  yearlyChartCanvasContent: any;
  monthlyChartCanvasContent: any;
  weeklyChartCanvasContent: any;
  hourlyChartCanvasContent: any;

  yearlyChart: any;
  monthlyChart: any;
  weeklyChart: any;
  hourlyChart: any;

  customers: any;
  customersSelectorListener: any;
  selectedCupsCustomer:any;
  dateSelectorListener: any;
  year!: number;
  date!: string;
  unformattedDate: Date = new Date();
  week!: number;
  cupsId!: number;

  simpleWeekDateInit: string = '';
  simpleWeekDateEnd: string = '';

  originDataTypes:string[]=['Datadis','Inverter','Smart meter','Other']
  selectedCupsOriginDataType:string='';

  constructor(private energyService: EnergyService, private customersService: CustomersService, private fb: FormBuilder, private datadisEnergyService:DatadisEnergyService) {}

  ngOnInit() {
    this.yearlyChartCanvas = document.getElementById('doughnut-yearly-chart');
    this.monthlyChartCanvas = document.getElementById('yearly-chart');
    this.weeklyChartCanvas = document.getElementById('weekly-chart');
    this.hourlyChartCanvas = document.getElementById('hourly-chart');

    this.yearlyChartCanvasContent = this.yearlyChartCanvas.getContext('2d');
    this.monthlyChartCanvasContent = this.monthlyChartCanvas.getContext('2d');
    this.weeklyChartCanvasContent = this.weeklyChartCanvas.getContext('2d');
    this.hourlyChartCanvasContent = this.hourlyChartCanvas.getContext('2d');

    //get date, week and year:
    let newDate = new Date();
    if (!this.date) {
      this.date = this.date || `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}`;
      //this.date = moment(this.date).format('DD/MM/YYYY')
      this.week = this.getWeekNumber(new Date(newDate))
    } else {
      this.week = this.getWeekNumber(new Date(this.unformattedDate))
    }
    this.year = this.year || new Date().getFullYear();

  }

  ngAfterViewInit(): void {

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data;

      console.log(this.customers)

      //set default value to selected cups:
      this.cupsId = this.customers[0].id
      //get chart info:
      let {yearEnergy,weekEnergy,dayEnergy} = await this.getChartInfo(this.cupsId, this.year, this.week, this.date)
      //update charts:
      this.updateCharts(yearEnergy,weekEnergy,dayEnergy)
    })

    //customer selector listener
    this.customersSelectorListener = document.getElementById('customerSelector')!.addEventListener('change', async (event: any) => {
      
      this.cupsId = this.selectedCupsCustomer.id;
      this.getOriginData();

      //get chart info:
      let {yearEnergy,weekEnergy,dayEnergy} = await this.getChartInfo(this.cupsId, this.year, this.week, this.date)
      //update charts:
      this.updateCharts(yearEnergy,weekEnergy,dayEnergy)
    })

    //date selector listener
    this.dateSelectorListener = document.getElementById('daySelector')!.addEventListener('change', async (event: any) => {
      if (!this.cupsId) {
        //todo: show message 'please select a prosumer'
        console.log('show message: please select a prosumer')

      } else {
        this.unformattedDate = new Date(event.target.value);
        this.date = `${this.unformattedDate.getDate()}/${this.unformattedDate.getMonth() + 1}/${this.unformattedDate.getFullYear()}`;
        this.year = new Date(this.unformattedDate).getFullYear()
        this.week = this.getWeekNumber(new Date(this.unformattedDate))

        //get chart info:
        let {yearEnergy,weekEnergy,dayEnergy} = await this.getChartInfo(this.cupsId, this.year, this.week, this.date)
        //update charts:
        this.updateCharts(yearEnergy,weekEnergy,dayEnergy)
      }
    })

  }


  getOriginData(){
    console.log(this.selectedCupsCustomer)
    if(this.selectedCupsCustomer.datadis_active){
      this.selectedCupsOriginDataType='Datadis';
    } else if(this.selectedCupsCustomer.inverter_active) {
      this.selectedCupsOriginDataType='Inverter';
    } else if(this.selectedCupsCustomer.smart_meter_active) {
      this.selectedCupsOriginDataType='Smart meter';
    } else {
      this.selectedCupsOriginDataType='Other';
    }
    console.log(this.selectedCupsOriginDataType)
  } 

  async updateCharts(yearEnergy:any,weekEnergy:any,dayEnergy:any) {

    if (weekEnergy.weekDateLimits) {
      this.updateWeekDateLimits(this.week, weekEnergy.weekDateLimits) //todo error
    }
    this.updateYearChart(yearEnergy)
    this.updateMonthlyChart(yearEnergy)
    this.updateWeekChart(weekEnergy)
    this.updateHourlyChart(dayEnergy)
  };

  getWeekNumber(date: Date) {
    // Clona el objeto de fecha para evitar modificaciones no deseadas
    let clonedDate: any = new Date(date);

    // Ajusta el día al jueves de la semana actual
    clonedDate.setDate(clonedDate.getDate() + 4 - (clonedDate.getDay() || 7));

    // Obtiene la fecha del primer día del año
    let yearStart: any = new Date(clonedDate.getFullYear(), 0, 1);

    // Calcula el número de días transcurridos desde el primer día del año
    let days = Math.floor((clonedDate - yearStart) / 86400000);

    // Calcula el número de la semana (semanas completas más una semana adicional si el resto de días es mayor a 3)
    let weekNumber = Math.ceil((days + 1) / 7);

    return weekNumber;
  }

  async getChartInfo(cupsId: number, year: number, week: number, date: string){
    console.log(cupsId, year, week, date)
    let yearEnergy = await this.getYearEnergy(year, cupsId)
    let weekEnergy = await this.getEnergyByWeek(week, year, cupsId)
    let dayEnergy = await this.getEnergyByDay(cupsId, date)

    return {yearEnergy,weekEnergy,dayEnergy}
  }

  getYearEnergy(year: number, cups?: number, community?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      //if(cups){

      if(this.selectedCupsOriginDataType=='Datadis'){
        this.datadisEnergyService.getYearByCups(year, cups!).subscribe((res: any) => {
          let monthlyCupsData = res.data;
          let months: string[] = monthlyCupsData.map((entry: any) => entry.month);
          let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.import);
          let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.generation);
          let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.export);
          let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.consumption);
          let yearEnergy = {months, kwhImport, kwhGeneration,kwhConsumption,kwhExport}
          resolve(yearEnergy)
        })
      } else {
        this.energyService.getYearByCups(year, cups!).subscribe((res: any) => {
          let monthlyCupsData = res.data;
          let months: string[] = monthlyCupsData.map((entry: any) => entry.month);
          let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.import);
          let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.generation);
          let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.export);
          let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.consumption);
          let yearEnergy = {months, kwhImport, kwhGeneration,kwhConsumption,kwhExport}
          resolve(yearEnergy)
        })
      }
    })
  }

  getEnergyByWeek(week: number, year: number, cups?: number, community?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      //if(cups){
      this.energyService.getWeekByCups(year, cups!, week).subscribe((res: any) => {
        let weekDateLimits: any;
        let weekCupsData = res.data;
        let weekDays = weekCupsData.map((entry: any) => entry.week_day);
        let weekImport = weekCupsData.map((entry: any) => entry.import);
        let weekGeneration = weekCupsData.map((entry: any) => entry.generation);
        let weekConsumption = weekCupsData.map((entry: any) => entry.consumption);
        let weekExport = weekCupsData.map((entry: any) => entry.export);
        console.log("week cups data", weekCupsData)

        if (weekCupsData[0] && weekCupsData[1]) {
          weekDateLimits = [weekCupsData[0].date, weekCupsData[weekCupsData.length - 1].date]
        }

        let weekEnergy = {weekDays, weekImport, weekGeneration,weekConsumption,weekExport, weekDateLimits}
        resolve(weekEnergy)
      })
      //}else if(community){{
      //todo
      //}
    })
  }

  getEnergyByDay(cups: number, date: string): Promise<any> {
    date = moment(date,'DD/MM/yyyy').format('YYYY-MM-DD')
    return new Promise((resolve, reject) => {
        this.energyService.getHoursByCups(cups, date).subscribe((res: any) => {

          let hourlyData = res.data
          const getHour = (datetimeString: any) => {
            return parseInt(datetimeString.slice(11, 13));
          };

          // Ordenar hourlyData por la hora
          hourlyData = hourlyData.sort((a: any, b: any) => getHour(a.info_datetime) - getHour(b.info_datetime));

        /*  console.log("hourly data: ",hourlyData)*/

        /*  let hours: any = hourlyData
            .filter((entry: any) => {
              entry
            })
            .map((entry: any) => {
              if (entry.info_datetime) {
                return moment.utc(entry.info_datetime).format('HH');
              } else return undefined
            });*/

          let hours = hourlyData.map((entry: any) => moment.utc(entry.info_datetime).format('HH'));
          let dayImport = hourlyData.map((entry: any) => entry.import);
          let dayGeneration = hourlyData.map((entry: any) => entry.generation);
          let dayConsumption = hourlyData.map((entry: any) => entry.consumption);
          let dayExport = hourlyData.map((entry: any) => entry.export);

          let dayEnergy = {hours, dayImport, dayGeneration, dayConsumption, dayExport}

          //console.log( "day result : ",hours,dayImport,dayGeneration,dayConsumption,dayExport)
          resolve(dayEnergy)
        })
      }
    )
  }

  updateYearChart(yearEnergy:any) {

    const sumImport = yearEnergy.kwhImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
    const sumGeneration = yearEnergy.kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
    const sumConsumption = yearEnergy.kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
    const sumExport = yearEnergy.kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);

    if (!this.yearlyChart) {
      this.yearlyChart = new Chart(this.yearlyChartCanvasContent, {type: 'pie', data: {labels: [], datasets: []}})
    }

    this.yearlyChart.data = {
      labels: [`Import: ${sumImport} Kwh`, `Generation: ${sumGeneration} Kwh`,`Consumption: ${sumConsumption} Kwh`,`Surplus: ${sumExport} Kwh`],
      datasets: [{
        data: [sumImport, sumGeneration,sumConsumption,sumExport],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgba(240, 190, 48, 1)',
          'rgba(33, 217, 92, 0.71)'
        ]
      }]
    }

    this.yearlyChart.update();

  }

  updateMonthlyChart(yearEnergy:any) {

    if (!this.monthlyChart) {
      this.monthlyChart = new Chart(this.monthlyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.monthlyChart.data = {
      labels: yearEnergy.months,
      datasets: [{
        label: 'Import (Kwh)',
        data: yearEnergy.kwhImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Generation (Kwh)',
        data: yearEnergy.kwhGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      }, {
        label: 'Consumption (Kwh)',
        data: yearEnergy.kwhConsumption,
        backgroundColor: 'rgba(240, 190, 48, 1)', // Color para importación
        borderColor: 'rgba(240, 190, 48, 1)', // Borde del color de importación
        borderWidth: 1
      }, {
        label: 'Surplus (Kwh)',
        data: yearEnergy.kwhExport,
        backgroundColor: 'rgba(33, 217, 92, 0.71)', // Color para importación
        borderColor: 'rgba(33, 217, 92, 0.71)', // Borde del color de importación
        borderWidth: 1
      }]
    }
    this.monthlyChart.update();
  }

  updateWeekChart(weekEnergy:any) {

    //console.log("week result: , weekDays, totalImport, totalGeneration)

    if (!this.weeklyChart) {
      this.weeklyChart = new Chart(this.weeklyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.weeklyChart.data = {
      labels: weekEnergy.weekDays,
      datasets: [{
        label: 'Import (Kwh)',
        data: weekEnergy.weekImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Generation (Kwh)',
        data: weekEnergy.weekGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      }, {
        label: 'Consumption (Kwh)',
        data: weekEnergy.weekConsumption,
        backgroundColor: 'rgba(240, 190, 48, 1)', // Color para importación
        borderColor: 'rgba(240, 190, 48, 1)', // Borde del color de importación
        borderWidth: 1
      }, {
        label: 'Surplus (Kwh)',
        data: weekEnergy.weekExport,
        backgroundColor: 'rgba(33, 217, 92, 0.71)', // Color para importación
        borderColor: 'rgba(33, 217, 92, 0.71)', // Borde del color de importación
        borderWidth: 1
      }]
    }

    this.weeklyChart.update();

  }

  updateHourlyChart(dayEnergy:any){

    if (!this.hourlyChart) {
      this.hourlyChart = new Chart(this.hourlyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.hourlyChart.data = {
      labels: dayEnergy.hours,
      datasets: [{
        label: 'Import (Kwh)',
        data: dayEnergy.dayImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Generation (Kwh)',
        data: dayEnergy.dayGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      },
       {
        label: 'Surplus (Kwh)',
        data: dayEnergy.dayExport,
        backgroundColor: 'rgba(33, 217, 92, 0.71)', // Color para importación
        borderColor: 'rgba(33, 217, 92, 0.71)', // Borde del color de importación
        borderWidth: 1
       }
    ]
    }

    this.hourlyChart.update();
  }

  updateWeekDateLimits(week:number, weekDateLimits:any) {
    let weekDateInit = new Date(weekDateLimits[0]);
    let weekDateEnd = new Date(weekDateLimits[1]);
    this.simpleWeekDateInit = `${weekDateInit.getFullYear()}/${weekDateInit.getMonth() + 1}/${weekDateInit.getDate()}`
    this.simpleWeekDateInit = moment(this.simpleWeekDateInit).format('DD/MM/YYYY')
    this.simpleWeekDateEnd = `${weekDateEnd.getFullYear()}/${weekDateEnd.getMonth() + 1}/${weekDateEnd.getDate()}`
    this.simpleWeekDateEnd = moment(this.simpleWeekDateEnd).format('DD/MM/YYYY')
  }

}
