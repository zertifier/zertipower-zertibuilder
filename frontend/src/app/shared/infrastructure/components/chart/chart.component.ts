import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation} from "@angular/core";
import Chart from "chart.js/auto";

@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html'
})

export class AppChartComponent implements OnInit, OnChanges {

    @ViewChild('chart') chart: any;
    chartCanvas: any;
    chartCanvasContent: any;

    @Input() chartType: any = 'pie';
    @Input() labels: string[] = [];
    @Input() datasets: any[] = [];
    @Input() data: number[] = [];
    @Input() backgroundColor: string[] = [];

    @Input() update: boolean = false;

    constructor() {

    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        for (const propName in changes) {
            if (changes.hasOwnProperty(propName)) {
                switch (propName) {
                    case 'update':
                        if (changes['update'].currentValue) {
                          console.log(changes['update'].currentValue)
                          this.updateChart();
                        } else {
                          console.log(changes['update'].currentValue)
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    updateChart(){
      this.chartCanvas = document.getElementById('custom-chart');
      console.log(this.chartCanvas)
      this.chartCanvasContent = this.chartCanvas.getContext('2d');
      console.log(this.chartCanvasContent)
      if (!this.chart) {
        this.chart = new Chart(this.chartCanvasContent, {type: this.chartType, data: {labels: [], datasets: []}})
      }
      this.chart.data = {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: this.backgroundColor
        }]
      }
      this.chart.update();
    }

}
