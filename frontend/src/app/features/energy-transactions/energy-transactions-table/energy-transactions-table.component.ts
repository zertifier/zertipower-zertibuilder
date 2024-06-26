import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { EnergyTransactionsFormComponent } from '../energy-transactions-form/energy-transactions-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { EnergyTransactionsApiService } from '../energy-transactions.service';
import moment from 'moment';

@Component({
  selector: 'energy-transactions-table',
  templateUrl: './energy-transactions-table.component.html',
  styleUrls: ['./energy-transactions-table.component.scss'],
})
export class EnergyTransactionsTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: EnergyTransactionsApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'energy_transactions';
  addRows: boolean = false;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energy-transactions/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Id',
      data: 'id',
      width: '60px',
    },
    {
      title: 'Cups',
      data: 'cups',
      width: '100px',
    },
    {
      title: 'InfoDt',
      data: 'info_dt',
      width: '100px',
    },
    {
      title: 'Kwh entrada',
      data: 'kwh_in',
      width: '100px',
    },
    {
      title: 'Kwh sortida',
      data: 'kwh_out',
      width: '100px',
    },
    {
      title: 'KwhSurplus',
      data: 'kwh_surplus',
      width: '100px',
    },
    {
      title: 'Tram',
      data: 'reference',
      width: '100px',
    },
    {
      title: 'Tx kwh entrada',
      data: 'tx_kwh_in',
      width: '100px',
    },
    {
      title: 'Tx kwh sortida',
      data: 'tx_kwh_out',
      width: '100px',
    }/*,
    {
       title: 'CreatedAt',
       data: 'created_at',
       width: '100px',
     },
     {
       title: '',
       data: 'id',
       width: '100px'
     }*/
  ];

  filterParams: filterParams[] = [
      {
        title: 'id',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'cups',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'info_dt',
        description: '',
        value: '',
        type: 3,
        defaultData: 0,
        options: [],
      },
      {
        title: 'kwh_in',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'kwh_out',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'kwh_surplus',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'block_id',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'tx_kwh_in',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'tx_kwh_out',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      /*{
        title: 'created_at',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },*/
  ];

  columnDefs:any[] = [
    /*{
      orderable: false, targets: [this.filterParams.length],
    },*/
    {
      targets: 2,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('DD-MM-YYYY')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
      targets: 7,
      render: (data: any, type: any, row: any) => {
        if (row.tx_kwh_in){
          return `<span>${data}<a href="https://gnosisscan.io/tx/${row.tx_kwh_in}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square ms-2"></i></a></span>`
        }
        return `<span>${data}</span>`
      }
    },
    {
      targets: 8,
      render: (data: any, type: any, row: any) => {
        if (row.tx_kwh_out){
          return `<span>${data}<a href="https://gnosisscan.io/tx/${row.tx_kwh_out}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square ms-2"></i></a></span>`
        }
        return `<span>${data}</span>`
      }
    },
    /*{
      targets: 7,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
      targets: this.filterParams.length,
      title: '',
      render: (data: any, type: any, row: any) => {
        return `
         <div class="d-flex justify-content-end">
            <div class="d-flex justify-content-start" style="width: 80px">
                <button type="button" class="btn btn-column column btn-transparent editRow" data-id=${data}><i class="fa-solid fa-pen-to-square hoverPrimary editRow" data-id=${data}></i></button>
                <button type="button" class="btn btn-column btn-transparent deleteRow" data-id=${data}><i class="fa-solid fa-xmark hoverDanger deleteRow" data-id=${data}></i></button>
            </div>
         </div>
        `
      }
    }*/
  ];

  editRequest(id:any) {
    const modalRef = this.ngbModal.open(EnergyTransactionsFormComponent);
    modalRef.componentInstance.setEditingId(parseInt(id));

    this.subscriptions.push(
      modalRef.closed.subscribe(() => this.datatable.updateTable()),
    )
  }

  async deleteRequest(id:any) {
    const response = await Swal.fire({
      icon: 'question',
      title: 'Are you sure?',
      showCancelButton: true,
    });

    if(!response.isConfirmed) {
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
