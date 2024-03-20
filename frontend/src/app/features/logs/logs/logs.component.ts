import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import moment from 'moment';
import { LogsFormComponent } from '../logs-form/logs-form.component';

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
      title:'',
      className: '', //dt-control
      orderable: false,
      data: null,
      defaultContent: '',
      width:'20px'
    },
    {
      title: 'Date',
      data: 'creation_dt',
      width: '100px',
    },
    {
      title: 'Cups',
      data: 'cups',
      width: '70px',
    },
    {
      title: 'status',
      data: 'status',
      width: '30px',
    },
    {
      title: 'Operation',
      data: 'operation',
      width: '150px',
    },
    {
        title: 'Inserts',
        data: 'n_affected_registers',
        width: '20px',
    },
    {
        title: 'Error message',
        data: 'error_message',
        width: '150px',
    },
    // {
    //   title: 'UpdatedAt',
    //   data: 'updated_at',
    //   width: '100px',
    // },
    {
      title: '',
      data: 'id',
      width: '100px',
      orderable: false
    }
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
        title: 'open',
        description: '',
        value: '',
        type: 4,
        defaultData: 0,
        options: [],
      },
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
        title: 'operation',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
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

        for (let clave in data){
          if(typeof data[clave]=='string'){
            if(data[clave].length>25)
            data[clave]=`${data[clave].slice(0,25)}...`
          }
        }

        return ``
      }
    },
    {
      targets: 1,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
    targets: 3,
        render: (data: any, type: any, row: any) => {
            // Variable para almacenar el estilo del círculo
            let circleStyle = '';

            // Asignar el estilo de acuerdo al valor de los datos
            switch (data) {
                case 'warning':
                    circleStyle = 'background-color: yellow;';
                    break;
                case 'error':
                    circleStyle = 'background-color: red;';
                    break;
                case 'success':
                    circleStyle = 'background-color: green;';
                    break;
                default:
                    circleStyle = '';
            }

            // Generar HTML con el círculo y la fecha
            return `<div class="">
                        <div style="width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; ${circleStyle}"></div>
                    </div>`;
        }
      },
    // {
    //   targets: 4,
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
                <button type="button" class="btn btn-column column btn-transparent editRow" data-id=${data}><i class="fa-solid fa-eye hoverPrimary editRow" data-id=${data}></i></button>
            </div>
         </div>
        `
      }
    }
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  editRequest(id:any) {
    const modalRef = this.ngbModal.open(LogsFormComponent);
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
      //this.apiService.remove(parseInt(id)).subscribe(() => this.datatable.updateTable())
    )
  }

}