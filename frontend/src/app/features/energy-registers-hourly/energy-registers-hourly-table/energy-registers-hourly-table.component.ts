import {Component, OnDestroy, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {dtColumns} from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import {filterParams} from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import {environment} from 'src/environments/environment';
/*import {
  EnergyRegistersHourlyFormComponent
} from '../energy-registers-hourly-form/energy-registers-hourly-form.component';*/
import {Subscription} from "rxjs";
import {AppDatatableComponent} from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { EnergyRegistersHourlyApiService} from '../energy-registers-hourly.service';
import moment from 'moment';

@Component({
  selector: 'energy-registers-hourly-table',
  templateUrl: './energy-registers-hourly-table.component.html',
  styleUrls: ['./energy-registers-hourly-table.component.scss'],
})
export class EnergyRegistersHourlyTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: EnergyRegistersHourlyApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'Energy registers hourly';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energy-registers-hourly/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Info Dt',
      data: 'infoDatetime',
      width: '100px',
    },
    {
      title: 'Cups Id',
      data: 'cupsId',
      width: '100px',
    },
    {
      title: 'Import',
      data: 'import',
      width: '100px',
    },
    {
      title: 'Consumption',
      data: 'consumption',
      width: '100px',
    },
    {
      title: 'Export',
      data: 'export',
      width: '100px',
    },
    {
      title: 'Generation',
      data: 'generation',
      width: '100px',
    }
  ];

  filterParams: filterParams[] = [
    {
      title: 'infoDatetime',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'cupsId',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'import',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'consumption',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'export',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'generation',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    }
  ];

  columnDefs: any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 1,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    }
  ];

/*  editRequest(id: any) {
    const modalRef = this.ngbModal.open(EnergyRegistersHourlyFormComponent);
    modalRef.componentInstance.setEditingId(parseInt(id));

    this.subscriptions.push(
      modalRef.closed.subscribe(() => this.datatable.updateTable()),
    )
  }*/

  async deleteRequest(id: any) {
    const response = await Swal.fire({
      icon: 'question',
      title: 'Are you sure?',
      showCancelButton: true,
    });

    if (!response.isConfirmed) {
      return;
    }

    this.subscriptions.push(
      this.apiService.remove(parseInt(id)).subscribe(() => this.datatable.updateTable())
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
