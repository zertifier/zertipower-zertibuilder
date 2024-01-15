import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import Chart from "chart.js/auto";
import {Observable, Subject} from "rxjs";
import {waitForAsync} from "@angular/core/testing";
import {getLocaleFirstDayOfWeek} from "@angular/common";

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html'
})

export class AppChartComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('chart') chart: any;
  chartCanvas: any;
  chartCanvasContent: any;

  @Input() chartId:string = 'custom-chart';
  @Input() chartType: any = 'pie';
  @Input() labels: string[] = [];
  @Input() datasets: any[] | undefined = undefined;
  @Input() data: any[] = [];
  @Input() backgroundColor: string[] = [];

  @Input() update: boolean = false;
  @Input() updateSubject!: Observable<any>;

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
/*
    this.chartCanvas = document.getElementById(this.chartId);
    this.chartCanvasContent = this.chartCanvas.getContext('2d');
    console.log("chart canvas content", this.chartCanvasContent)

    this.updateSubject?.subscribe(async (update) => {
      await this.delay(500);
      if (update) {
        this.updateChart();
      }
    }) */
  }

  ngAfterViewInit() {
    console.log(this.chartId)
    this.chartCanvas = document.getElementById(this.chartId);
    this.chartCanvasContent = this.chartCanvas.getContext('2d');

    this.updateSubject?.subscribe(async (update) => {
      await this.delay(500);
      if (update) {
        this.updateChart();
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'update':
            /*if (changes['update'].currentValue) {
              console.log(changes['update'].currentValue)
              this.updateChart();
            } else {
              console.log(changes['update'].currentValue)
            }*/
            break;
          case 'updateSubject':
            //console.log(changes['updateSubject'].currentValue)
            break;
          default:
            break;
        }
      }
    }
  }

  updateChart() {

    console.log("update chart", this.labels)

    if (!this.chart) {
      this.chart = new Chart(this.chartCanvasContent, {type: this.chartType, data: {labels: [], datasets: []}})
    }

    this.chart.data = {
      labels: this.labels,
      datasets: this.datasets || [{
        data: this.data,
        backgroundColor: this.backgroundColor
      }],
      options:{
        responsive:true,
        mantainAspectRatio:true
      }
    }
    this.chart.update();
    this.cdr.detectChanges();
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

}