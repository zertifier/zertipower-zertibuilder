import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import moment from 'moment';

@Component({
  selector: 'logs',
  templateUrl: './logs.component.html'
})
export class LogsComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'Logs';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energyRegistersLogs/datatable`;
  columns: dtColumns[] = [
    // {
    //   title: 'Id',
    //   data: 'id',
    //   width: '100px',
    // },
    
    {
      title: 'Date',
      data: 'creation_dt',
      width: '100px',
    },
    {
      title: 'Cups',
      data: 'cups',
      width: '100px',
    },
    {
      title: 'Operation',
      data: 'operation',
      width: '100px',
    }
    ,{
        title: 'status',
        data: 'status',
        width: '100px',
    },
    {
        title: 'Affected registers',
        data: 'n_affected_registers',
        width: '100px',
    },
    {
        title: 'Error message',
        data: 'error_message',
        width: '100px',
    }
    // {
    //   title: 'UpdatedAt',
    //   data: 'updated_at',
    //   width: '100px',
    // },
    // {
    //   title: '',
    //   data: 'id',
    //   width: '100px'
    // }
  ];

  filterParams: filterParams[] = [
      // {
      //   title: 'id',
      //   description: '',
      //   value: '',
      //   type: 1,
      //   defaultData: 0,
      //   options: [],
      // },
      
      {
        title: 'creation_dt',
        description: '',
        value: '',
        type: 3,
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
        title: 'operation',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'status',
        description: '',
        value: '',
        type: 2,
        defaultData: 1,
        options: [
            {
            "name": "",
            "value": ""
            },
            {
            "name":"error",
            "value":"error"
            },
            {
            "name":"success",
            "value":"success"
            },
            {
            "name":"warning",
            "value":"warning"
            },
        ]
      },
      {
        title: 'n_affected_registers',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'error_message',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      }
  ];

  columnDefs:any[] = [
    {
      orderable: false, targets: [this.filterParams.length-1],
    },
    {
      targets: 0,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    // {
    //   targets: 4,
    //   render: (data: any, type: any, row: any) => {
    //     return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
    //   }
    // },
    // {
    //   targets: this.filterParams.length,
    //   title: '',
    //   render: (data: any, type: any, row: any) => {
    //     return `
    //      <div class="d-flex justify-content-end">
    //         <div class="d-flex justify-content-start" style="width: 80px">
    //             <button type="button" class="btn btn-column column btn-transparent editRow" data-id=${data}><i class="fa-solid fa-pen-to-square hoverPrimary editRow" data-id=${data}></i></button>
    //         </div>
    //      </div>
    //     `
    //   }
    // }
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  editRequest(id:any) {
    // const modalRef = this.ngbModal.open(CustomersFormComponent);
    // modalRef.componentInstance.setEditingId(parseInt(id));

    // this.subscriptions.push(
    //   modalRef.closed.subscribe(() => this.datatable.updateTable()),
    // )
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
      //this.apiService.remove(parseInt(id)).subscribe(() => this.datatable.updateTable())
    )
  }

}
