import {Component, OnDestroy, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {dtColumns} from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import {filterParams, filterType} from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import {environment} from 'src/environments/environment';
/*import {
  EnergyRegistersHourlyFormComponent
} from '../energy-registers-hourly-form/energy-registers-hourly-form.component';*/
import {Subscription} from "rxjs";
import {AppDatatableComponent} from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { EnergyHourlyApiService} from '../energy-hourly.service';
import moment from 'moment';

@Component({
  selector: 'energy-hourly-table',
  templateUrl: './energy-hourly-table.component.html',
  styleUrls: ['./energy-hourly-table.component.scss'],
})
export class EnergyHourlyTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: EnergyHourlyApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'Energy hourly';
  addRows: boolean = false;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energy-hourly/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Data',
      data: 'info_dt',
      width: '200px',
    },
    {
      title: 'Cups',
      data: 'cups',
      width: '100px',
    },
    {
      title: 'Consum',
      data: 'kwh_in',
      width: '100px',
    },
    {
      title: 'Excedent',
      data: 'kwh_out',
      width: '100px',
    },
    {
      title: 'Excedent virtual',
      data: 'kwh_out_virtual',
      width: '100px',
    },
    {
      title: 'Preu consum',
      data: 'kwh_in_price',
      width: '100px',
    },
    {
      title: 'Preu excedent',
      data: 'kwh_out_price',
      width: '100px',
    },
    {
      title: 'Compartició',
      data: 'shares',
      width: '100px',
    },
    {
      title: 'Tram',
      data: 'type',
      width: '100px',
    },
    {
      title: 'Origen',
      data: 'origin',
      width: '100px',
    }
  ];

  filterParams: filterParams[] = [
    {
      title: 'info_dt',
      description: '',
      value: '',
      type: filterType.datetime,
      defaultData: 0,
      options: [],
    },
    {
      title: 'cups',
      description: '',
      value: '',
      type: filterType.text,
      defaultData: 0,
      options: [],
    },
    {
      title: 'kwh_in',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'kwh_out',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'kwh_out_virtual',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'kwh_in_price',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'kwh_out_price',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'shares',
      description: '',
      value: '',
      type: filterType.number,
      defaultData: 0,
      options: [],
    },
    {
      title: 'type',
      description: '',
      value: '',
      type: filterType.selection,
      defaultData: 1,
      binarySelector:true,
      defaultTranslation:["Vall","Pla","Punta"],
      options: [
        {
          name: "Vall",
          value: "Valle"
        },
        {
          name: "Pla",
          value: "Llano"
        },
        {
          name: "Punta",
          value: "Punta"
        },
      ]
    },
    {
      title: 'origin',
      description: '',
      value: '',
      type: filterType.text,
      defaultData: 0,
      options: [],
    }
  ];

  columnDefs: any[] = [
    {
      targets: 0,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
      targets: 8,
      render: (data: any, type: any, row: any) => {
        switch (data) {
          case 'Valle':
            return 'Vall';
          case 'Llano':
            return 'Pla';
          case 'Punta':
            return 'Punta';
          default:
            return data;
        }
      }
    },
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}