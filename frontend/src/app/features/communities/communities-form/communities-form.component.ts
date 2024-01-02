import {Component, OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { CommunitiesApiService } from '../communities.service';
import moment from 'moment';
import {CustomersService} from "../../../core/core-services/customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy/energy.service";
import Chart from "chart.js/auto";

@Component({
  selector: 'communities-form',
  templateUrl: './communities-form.component.html',
  styleUrls: ['./communities-form.component.scss'],
})
export class CommunitiesFormComponent implements OnInit{

  @ViewChild('yearChart') yearChart: any;

  tinymceConfig = {
    language: 'es',
    language_url: '/assets/tinymce/langs/es.js',
    plugins: 'lists link image table code help wordcount',
    toolbar:
      'blocks bold italic forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'image table | ' +
      'removeformat help',
    base_url: '/assets/tinymce',
    suffix: '.min',
    height: 200,
    statusbar: false,
    menubar: false,
    promotion: false,
  }

  customers:any[]=[];
  test: number=1;
  id: number = 0;
  communityCups: any[]=[];

  selectedCups:number=0;
  sumImport:number=0;
  sumGeneration:number=0;
  sumConsumption:number=0;
  sumExport:number=0;

  yearlyChartCanvas: any;
  yearlyChartCanvasContent: any;
  yearlyChart: any;

  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    name: new FormControl<string | null>(null),
    test: new FormControl<number | null>(null),
    createdAt: new FormControl<string | null>(null),
    updatedAt: new FormControl<string | null>(null),
  });
  constructor(
    private formBuilder: FormBuilder,
    private apiService: CommunitiesApiService,
    private activeModal: NgbActiveModal,
    private customersService:CustomersService,
    private energyService:EnergyService
  ) {}

  ngOnInit() {
    this.yearlyChartCanvas = document.getElementById('yearly-chart');
    this.yearlyChartCanvasContent = this.yearlyChartCanvas.getContext('2d');
    this.getInfo()
  }

  changeTest(event:any){
    console.log(event)
  }

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {
      console.log(data)
      this.form.controls.id.setValue(data.id);
      this.form.controls.name.setValue(data.name);
      this.form.controls.test.setValue(data.test);
      this.test = data.test;
      this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));
    });
  }

  getInfo(){
    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data[0];
      console.log("cups: ",this.customers)
      this.communityCups =  this.customers.filter((cups:any) =>
        cups.community_id==this.form.controls.id.getRawValue()
      )

      this.communityCups.forEach(async (cups:any) =>{
        let yearEnergy:any = await this.getYearEnergyByCups(cups.id,2023);
        cups.yearEnergy = yearEnergy;
        console.log("year energy",yearEnergy)
        this.sumImport+=yearEnergy.sumImport | 0,this.sumGeneration+=yearEnergy.sumGeneration | 0,this.sumConsumption+=yearEnergy.sumConsumption| 0,this.sumExport+=yearEnergy.sumExport| 0;
        this.updateYearChart()
      })
      console.log("community cups: ",this.communityCups)
    })
  }

  save() {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Form not valid'
      });
      return;
    }
    const values = this.getValues();
    let request: Observable<any>;
    if (!this.id) {
      request = this.apiService.save(values);
    } else {
      request = this.apiService.update(this.id, values);
    }
    request.subscribe(() => {
      Swal.fire({
        icon: 'success',
        title: 'Success!'
      });
      this.activeModal.close();
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }

  getValues(): any {
    const values: any = {};

    values.id = this.form.value.id;
    values.name = this.form.value.name;
    values.test = this.form.value.test;
    values.createdAt = this.form.value.createdAt;
    values.updatedAt = this.form.value.updatedAt;

    return values;
  }

  getYearEnergyByCups(cups: number,year: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.energyService.getYearByCups(year, cups!).subscribe((res: any) => {
        console.log(res.data)
        let monthlyCupsData = res.data;
        let months: string[] = monthlyCupsData.map((entry: any) => entry.month);
        let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.import);
        let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.generation);
        let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.export);
        let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.consumption);
        const sumImport = kwhImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
        const sumGeneration = kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
        const sumConsumption = kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
        const sumExport = kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
        let yearEnergy = {months, kwhImport, kwhGeneration,kwhConsumption,kwhExport,sumImport,sumGeneration,sumConsumption,sumExport}
        resolve(yearEnergy)
      })
    })
  }

  updateYearChart() {

    if (!this.yearlyChart) {
      this.yearlyChart = new Chart(this.yearlyChartCanvasContent, {type: 'pie', data: {labels: [], datasets: []}})
    }

    this.yearlyChart.data = {
      labels: [`Import: ${this.sumImport} Kwh`, `Generation: ${this.sumGeneration} Kwh`,`Consumption: ${this.sumConsumption} Kwh`,`Surplus: ${this.sumExport} Kwh`],
      datasets: [{
        data: [this.sumImport,this.sumGeneration,this.sumConsumption,this.sumExport],
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

}
