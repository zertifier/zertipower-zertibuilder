import {Component, ViewChild, AfterViewInit} from "@angular/core";
import Chart from 'chart.js/auto';
import {CustomersApiService} from "../../customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy/energy.service";
import {CustomersService} from "../../../core/core-services/customers/customers.service";

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {

  @ViewChild('yearChart') yearChart:any;
  canvas:any;
  ctx:any
  constructor(private energyService: EnergyService, private customersService:CustomersService) {
    customersService.getCustomers().subscribe((res)=>{
      console.log("ep ",res)
    })
  }
  ngAfterViewInit(): void {
    console.log("dd")
    this.canvas=document.getElementById('yearly-chart')
    this.ctx=this.canvas.getContext('2d');
    this.createChart()
  }

  createChart(){
    new Chart(this.ctx, {
      type: 'pie',
      data: {
        labels: ['yearly Consumption (Kwh)', 'yearly Generation (Kwh)'],
        datasets: [{
          data: [0, 1],
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)'
          ]
        }]
      }
    })
  }

}

