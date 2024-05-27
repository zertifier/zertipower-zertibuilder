import {Component, ViewChild, AfterViewInit, ElementRef, OnInit} from "@angular/core";
import Chart from 'chart.js/auto';
import {CustomersApiService} from "../../customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy.service";
import {CustomersService} from "../../../core/core-services/customers.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import moment from "moment";
import { log } from "console";
import { DatadisEnergyService } from "src/app/core/core-services/datadis-energy.service";
import { BehaviorSubject } from "rxjs";
import Swal from "sweetalert2";

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {

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

  originDataTypes:string[]=['Datadis','Inverter','Smart meter', 'Sensor','Other']
  selectedCupsOriginDataType:string='';

  // Year chart variables
  yearChartType: string = 'pie';
  yearChartLabels: string[] =  [];
  yearChartDatasets: any[] | undefined = undefined;
  yearChartData: any[] = [];
  yearChartBackgroundColor: string [] = [];
  updateYearChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Month chart variables
  monthChartType: string = 'bar';
  monthChartLabels: string[] =  ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octobre', 'Novembre', 'Decembre'];
  monthChartDatasets: any[] | undefined = undefined;
  monthChartData: any[] = [];
  monthChartBackgroundColor: string [] = [];
  updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Week chart variables:
  weekChartType: string = 'bar';
  weekChartLabels: string[] = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

  weekChartDatasets: any[] | undefined = undefined;
  weekChartData: any[] = [];
  weekChartBackgroundColor: string [] = [];
  updateWeekChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  //day chart variables:
  dayChartType: string = 'bar';
  dayChartLabels: string[] = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
  dayChartDatasets: any[] | undefined = undefined;
  dayChartData: any[] = [];
  dayChartBackgroundColor: string [] = [];
  updateDayChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  constructor(private energyService: EnergyService, private customersService: CustomersService, private fb: FormBuilder, private datadisEnergyService:DatadisEnergyService) {}

  ngOnInit() {

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

      //console.log(this.customers)

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
        Swal.fire("Cap usuari seleccionat","Selecciona un usuari","info")

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
    //console.log(this.selectedCupsCustomer)
    if(this.selectedCupsCustomer.datadis_active){
      this.selectedCupsOriginDataType='Datadis';
    } else if(this.selectedCupsCustomer.inverter_active) {
      this.selectedCupsOriginDataType='Inverter';
    } else if(this.selectedCupsCustomer.smart_meter_active) {
      this.selectedCupsOriginDataType='Smart meter';
    } else {
      this.selectedCupsOriginDataType='Other';
    }
    //console.log(this.selectedCupsOriginDataType)
  }

  async updateCharts(yearEnergy:any,weekEnergy:any,dayEnergy:any) {

    if (weekEnergy.weekDateLimits) {
      this.updateWeekDateLimits(this.week, weekEnergy.weekDateLimits) //todo error
    }
    this.updateYearChartF(yearEnergy)
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
    //console.log(cupsId, year, week, date)
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
          let months: string[] = monthlyCupsData.map((entry: any) => entry.month_name);
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
          let months: string[] = monthlyCupsData.map((entry: any) => entry.month_name);
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

    let date = moment(this.date,'D/M/YYYY').format('YYYY-MM-DD')

    return new Promise((resolve, reject) => {

      if(this.selectedCupsOriginDataType=='Datadis'){

        this.datadisEnergyService.getWeekByCups(date, cups!).subscribe((res: any) => {
          let weekDateLimits: any;
          let weekCupsData = res.data.rows;
          let weekDays = weekCupsData.map((entry: any) => entry.week_day);
          let weekImport = weekCupsData.map((entry: any) => entry.import);
          let weekGeneration = weekCupsData.map((entry: any) => entry.generation);
          let weekConsumption = weekCupsData.map((entry: any) => entry.consumption);
          let weekExport = weekCupsData.map((entry: any) => entry.export);
          //console.log("week cups data",res.data)

          if (weekCupsData[0] && weekCupsData[1]) {
            weekDateLimits = [weekCupsData[0].date, weekCupsData[weekCupsData.length - 1].date]
          }

          let weekEnergy = {weekDays, weekImport, weekGeneration,weekConsumption,weekExport, weekDateLimits}
          resolve(weekEnergy)
        })

      }else{

        this.energyService.getWeekByCups(date, cups!).subscribe((res: any) => {
          let weekDateLimits: any;
          let weekCupsData = res.data;
          let weekDays = weekCupsData.map((entry: any) => entry.week_day);
          let weekImport = weekCupsData.map((entry: any) => entry.import);
          let weekGeneration = weekCupsData.map((entry: any) => entry.generation);
          let weekConsumption = weekCupsData.map((entry: any) => entry.consumption);
          let weekExport = weekCupsData.map((entry: any) => entry.export);
          //console.log("week cups data", weekCupsData)

          if (weekCupsData[0] && weekCupsData[1]) {
            weekDateLimits = [weekCupsData[0].date, weekCupsData[weekCupsData.length - 1].date]
          }

          let weekEnergy = {weekDays, weekImport, weekGeneration,weekConsumption,weekExport, weekDateLimits}
          resolve(weekEnergy)
        })
      }
    })
  }

  getEnergyByDay(cups: number, date: string): Promise<any> {
    date = moment(date,'DD/MM/yyyy').format('YYYY-MM-DD')
    return new Promise((resolve, reject) => {

      if(this.selectedCupsOriginDataType=='Datadis'){
        this.datadisEnergyService.getHoursByCups(cups, date).subscribe((res: any) => {
          let hourlyData = res.data
          //console.log("hourly data", hourlyData)

          hourlyData.map((hd:any)=>{if(!hd.info_datetime){hd.info_datetime=hd.info_dt} })

          const getHour = (datetimeString: any) => {
            return parseInt(datetimeString.slice(11, 13));
          };

          hourlyData = hourlyData.sort((a: any, b: any) => getHour(a.info_datetime) - getHour(b.info_datetime));
          let hours = hourlyData.map((entry: any) => moment.utc(entry.info_datetime).format('HH'));
          let dayImport = hourlyData.map((entry: any) => entry.import);
          let dayGeneration = hourlyData.map((entry: any) => entry.generation);
          let dayConsumption = hourlyData.map((entry: any) => entry.consumption);
          let dayExport = hourlyData.map((entry: any) => entry.export);
          let dayEnergy = {hours, dayImport, dayGeneration, dayConsumption, dayExport}
          resolve(dayEnergy)
        })
      }else{
        this.energyService.getHoursByCups(cups, date).subscribe((res: any) => {
          let hourlyData = res.data
          const getHour = (datetimeString: any) => {
            return parseInt(datetimeString.slice(11, 13));
          };
          hourlyData = hourlyData.sort((a: any, b: any) => getHour(a.info_datetime) - getHour(b.info_datetime));
          let hours = hourlyData.map((entry: any) => moment.utc(entry.info_datetime).format('HH'));
          let dayImport = hourlyData.map((entry: any) => entry.import);
          let dayGeneration = hourlyData.map((entry: any) => entry.generation);
          let dayConsumption = hourlyData.map((entry: any) => entry.consumption);
          let dayExport = hourlyData.map((entry: any) => entry.export);
          let dayEnergy = {hours, dayImport, dayGeneration, dayConsumption, dayExport}
          resolve(dayEnergy)
        })
      }
      }
    )
  }

  updateYearChartF(yearEnergy:any) {

    const sumImport = yearEnergy.kwhImport.length > 0 ? yearEnergy.kwhImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0) : 0;
    const sumGeneration = yearEnergy.kwhGeneration.length > 0 ? yearEnergy.kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0)  : 0;
    const sumConsumption = yearEnergy.kwhConsumption.length > 0 ? yearEnergy.kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0)  : 0;
    const sumExport = yearEnergy.kwhExport.length > 0 ? yearEnergy.kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0)  : 0;

    this.yearChartLabels = ['Import (Kwh)','Consumption (Kwh)','Generation (Kwh)','Export (Kwh)']

    this.yearChartDatasets = [{
          data: [sumImport,sumConsumption,sumGeneration,sumExport],
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgba(240, 190, 48, 1)',
            'rgba(33, 217, 92, 0.71)',
            'rgb(54, 162, 235)',
          ]
        }]

    this.updateYearChartSubject.next(true);

  }

  updateMonthlyChart(yearEnergy:any) {

    //this.monthChartLabels=yearEnergy.months

    this.monthChartDatasets = [
      {
        label: 'Importació (Kwh)',
        data: yearEnergy.kwhImport,
        backgroundColor: 'rgb(255, 99, 132)'
      },
      {
        label: 'Consum (Kwh)',
        data: yearEnergy.kwhConsumption,
        backgroundColor: 'rgba(240, 190, 48, 1)'
      },
      {
        label: 'Generació (Kwh)',
        data: yearEnergy.kwhGeneration,
        backgroundColor: 'rgba(33, 217, 92, 0.71)'
      },
      {
        label: 'Exportació (Kwh)',
        data: yearEnergy.kwhExport,
        backgroundColor: 'rgb(54, 162, 235)'
      },
    ]

    this.updateMonthChartSubject.next(true);
  }

  updateWeekChart(weekEnergy:any) {

    //this.weekChartLabels = weekEnergy.weekDays;
    this.weekChartDatasets = [{
      label: 'Importació (Kwh)',
      data: weekEnergy.weekImport,
      backgroundColor: 'rgb(255, 99, 132)'
    }, {
      label: 'Consum (Kwh)',
      data: weekEnergy.weekConsumption,
      backgroundColor: 'rgba(240, 190, 48, 1)'
    }, {
      label: 'Generació (Kwh)',
      data: weekEnergy.weekGeneration,
      backgroundColor: 'rgba(33, 217, 92, 0.71)'
    },{
      label: 'Exportació (Kwh)',
      data: weekEnergy.weekExport,
      backgroundColor: 'rgb(54, 162, 235)'
    }]

    this.updateWeekChartSubject.next(true);

  }

  updateHourlyChart(dayEnergy:any){

    //this.dayChartLabels = dayEnergy.hours
    this.dayChartDatasets = [{
      label: 'Importació (Kwh)',
      data: dayEnergy.dayImport,
      backgroundColor: 'rgb(255, 99, 132)'
      }, {
        label: 'Consum (Kwh)',
        data: dayEnergy.weekConsumption,
        backgroundColor: 'rgba(240, 190, 48, 1)'
      },
     {
      label: 'Generació (Kwh)',
      data: dayEnergy.dayGeneration,
      backgroundColor: 'rgba(33, 217, 92, 0.71)'
    },
     {
      label: 'Exportació (Kwh)',
      data: dayEnergy.dayExport,
      backgroundColor: 'rgb(54, 162, 235)'
     }
  ]

  this.updateDayChartSubject.next(true);

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
