import {Component, ViewChild, AfterViewInit} from "@angular/core";
import {Chart} from 'chart.js';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit{

  canvas:any;
  ctx:any;
  @ViewChild('yearChart') yearChart:any;

  this.canvas=this.yearChart.nativeElement;
  this.ctx=this.canvas.getContext('2d');

  constructor() {
    console.log("hola")
  }
  ngAfterViewInit(): void {
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
