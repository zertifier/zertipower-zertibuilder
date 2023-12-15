import {Component, ViewChild, AfterViewInit, ElementRef} from "@angular/core";
import Chart from 'chart.js/auto';
import {CustomersApiService} from "../../customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy/energy.service";
import {CustomersService} from "../../../core/core-services/customers/customers.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import moment from "moment";

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {

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
  dateSelectorListener: any;
  year!: number;
  date!: string;
  unformattedDate: Date = new Date();
  week!: number;
  cupsId!: number;

  simpleWeekDateInit: string = '';
  simpleWeekDateEnd: string = '';

  constructor(private energyService: EnergyService, private customersService: CustomersService, private fb: FormBuilder) {
    customersService.getCustomersCups().subscribe((res: any) => {
      this.customers = res.data[0];
    })
  }

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

    this.yearlyChartCanvas = document.getElementById('doughnut-yearly-chart');
    this.monthlyChartCanvas = document.getElementById('yearly-chart');
    this.weeklyChartCanvas = document.getElementById('weekly-chart');
    this.hourlyChartCanvas = document.getElementById('hourly-chart');

    this.yearlyChartCanvasContent = this.yearlyChartCanvas.getContext('2d');
    this.monthlyChartCanvasContent = this.monthlyChartCanvas.getContext('2d');
    this.weeklyChartCanvasContent = this.weeklyChartCanvas.getContext('2d');
    this.hourlyChartCanvasContent = this.hourlyChartCanvas.getContext('2d');

    //customer selector listener
    this.customersSelectorListener = document.getElementById('customerSelector')!.addEventListener('change', (event: any) => {
      this.cupsId = event.target.value;

      //update charts
      this.updateCharts(this.cupsId, this.year, this.week, this.date)
    })

    //date selector listener
    this.dateSelectorListener = document.getElementById('daySelector')!.addEventListener('change', (event: any) => {
      if (!this.cupsId) {
        //todo: show message 'please select a prosumer'
        console.log('show message: please select a prosumer')

      } else {
        this.unformattedDate = new Date(event.target.value);
        this.date = `${this.unformattedDate.getDate()}/${this.unformattedDate.getMonth() + 1}/${this.unformattedDate.getFullYear()}`;
        this.year = new Date(this.unformattedDate).getFullYear()
        this.week = this.getWeekNumber(new Date(this.unformattedDate))
        this.updateCharts(this.cupsId, this.year, this.week, this.date)
      }
    })

  }

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

  async updateCharts(cupsId: number, year: number, week: number, date: string) {
    console.log("update charts")
    let {months, kwhImport, kwhGeneration} = await this.getYearEnergy(year, cupsId)
    let {weekDays, weekImport, weekGeneration, weekDateLimits} = await this.getEnergyByWeek(week, year, cupsId)
    let {hours, dayImport, dayGeneration, dayConsumption, dayExport} = await this.getEnergyByDay(cupsId, date)
    if (weekDateLimits) {
      this.updateWeekDateLimits(week, weekDateLimits) //todo error
    }
    this.updateYearChart(kwhImport, kwhGeneration)
    this.updateMonthlyChart(months, kwhImport, kwhGeneration)
    this.updateWeekChart(weekDays, weekImport, weekGeneration)
    this.updateHourlyChart(hours, dayImport, dayGeneration, dayConsumption, dayExport)
  };

  getYearEnergy(year: number, cups?: number, community?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      //if(cups){
      this.energyService.getYearByCups(year, cups!).subscribe((res: any) => {
        console.log(res.data)
        let monthlyCupsData = res.data;
        let months: string[] = monthlyCupsData.map((entry: any) => entry.month);
        let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.import);
        let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.generation);
        resolve({months, kwhImport, kwhGeneration})
      })
      //}else if (community){
      //todo
      //}

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
        console.log("week cups data", weekCupsData)

        if (weekCupsData[0] && weekCupsData[1]) {
          weekDateLimits = [weekCupsData[0].date, weekCupsData[weekCupsData.length - 1].date]
        }
        console.log("week date limits", weekDateLimits)
        resolve({weekDays, weekImport, weekGeneration, weekDateLimits})
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

          console.log(hours,dayImport,dayGeneration,dayConsumption,dayExport)
          resolve({hours, dayImport, dayGeneration, dayConsumption, dayExport})
        })
      }
    )
  }

  updateYearChart(kwhImport: number[], kwhGeneration: number[]) {
    const sumImport = kwhImport.reduce((partialSum: number, a: number) => partialSum + a, 0);
    const sumGeneration = kwhGeneration.reduce((partialSum: number, a: number) => partialSum + a, 0);

    if (!this.yearlyChart) {
      this.yearlyChart = new Chart(this.yearlyChartCanvasContent, {type: 'pie', data: {labels: [], datasets: []}})
    }

    this.yearlyChart.data = {
      labels: [`yearly Consumption: ${sumImport} Kwh`, `yearly Generation: ${sumGeneration} Kwh`],
      datasets: [{
        data: [sumImport, sumGeneration],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)'
        ]
      }]
    }

    this.yearlyChart.update();

  }

  updateMonthlyChart(months
                       :
                       string[], kwhImport
                       :
                       number[], kwhGeneration
                       :
                       number[]
  ) {

    if (!this.monthlyChart) {
      this.monthlyChart = new Chart(this.monthlyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.monthlyChart.data = {
      labels: months,
      datasets: [{
        label: 'Total Import (Kwh)',
        data: kwhImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Total Generation (Kwh)',
        data: kwhGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      }]
    }
    this.monthlyChart.update();
  }

  updateWeekChart(weekDays
                    :
                    string[], totalImport
                    :
                    [], totalGeneration
                    :
                    []
  ) {

    console.log(weekDays, totalImport, totalGeneration)

    if (!this.weeklyChart) {
      this.weeklyChart = new Chart(this.weeklyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.weeklyChart.data = {
      labels: weekDays,
      datasets: [{
        label: 'Total Import (Kwh)',
        data: totalImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Total Generation (Kwh)',
        data: totalGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      }]
    }

    this.weeklyChart.update();

  }

  updateHourlyChart(hours:string, dayImport:number, dayGeneration:number, dayConsumption:number, dayExport:number){
    if (!this.hourlyChart) {
      this.hourlyChart = new Chart(this.hourlyChartCanvasContent, {type: 'bar', data: {labels: [], datasets: []}})
    }

    this.hourlyChart.data = {
      labels: hours,
      datasets: [{
        label: 'Total Import (Kwh)',
        data: dayImport,
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color para generación
        borderColor: 'rgba(255, 99, 132, 1)', // Borde del color de generación
        borderWidth: 1
      }, {
        label: 'Total Generation (Kwh)',
        data: dayGeneration,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color para importación
        borderColor: 'rgba(75, 192, 192, 1)', // Borde del color de importación
        borderWidth: 1
      }]
    }

    this.hourlyChart.update();
  }

  updateWeekDateLimits(week
                         :
                         number, weekDateLimits
                         :
                         any
  ) {
    let weekDateInit = new Date(weekDateLimits[0]);
    let weekDateEnd = new Date(weekDateLimits[1]);
    this.simpleWeekDateInit = `${weekDateInit.getFullYear()}/${weekDateInit.getMonth() + 1}/${weekDateInit.getDate()}`
    this.simpleWeekDateInit = moment(this.simpleWeekDateInit).format('DD/MM/YYYY')
    this.simpleWeekDateEnd = `${weekDateEnd.getFullYear()}/${weekDateEnd.getMonth() + 1}/${weekDateEnd.getDate()}`
    this.simpleWeekDateEnd = moment(this.simpleWeekDateEnd).format('DD/MM/YYYY')
    console.log(this.simpleWeekDateInit, this.simpleWeekDateEnd)

  }

}
