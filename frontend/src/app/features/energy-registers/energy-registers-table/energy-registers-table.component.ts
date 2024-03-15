import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { EnergyRegistersFormComponent } from '../energy-registers-form/energy-registers-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { EnergyRegistersApiService } from '../energy-registers.service';
import moment from 'moment';

@Component({
  selector: 'energy-registers-table',
  templateUrl: './energy-registers-table.component.html',
  styleUrls: ['./energy-registers-table.component.scss'],
})
export class EnergyRegistersTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: EnergyRegistersApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'energy_registers';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energy-registers/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Id',
      data: 'id',
      width: '100px',
    },
    {
      title: 'InfoDt',
      data: 'info_dt',
      width: '100px',
    },
    {
      title: 'Cups',
      data: 'cups',
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
    },
    /*{
      title: 'CreatedAt',
      data: 'created_at',
      width: '100px',
    },
    {
      title: 'UpdatedAt',
      data: 'updated_at',
      width: '100px',
    },*/
    {
      title: '',
      data: 'id',
      width: '100px'
    }
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
        title: 'info_dt',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'cups',
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
      }/*,
      {
        title: 'created_at',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'updated_at',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },*/
  ];

  columnDefs:any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 1,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    // {
    //   targets: 7,
    //   render: (data: any, type: any, row: any) => {
    //     return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
    //   }
    // },
    // {
    //   targets: 8,
    //   render: (data: any, type: any, row: any) => {
    //     return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
    //   }
    // },
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
    }
  ];

  editRequest(id:any) {
    const modalRef = this.ngbModal.open(EnergyRegistersFormComponent);
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
