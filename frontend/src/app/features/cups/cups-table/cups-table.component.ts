import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { CupsFormComponent } from '../cups-form/cups-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { CupsApiService } from '../cups.service';
import moment from 'moment';

@Component({
  selector: 'cups-table',
  templateUrl: './cups-table.component.html',
  styleUrls: ['./cups-table.component.scss'],
})
export class CupsTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: CupsApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'cups';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/cups/datatable`;
  columns: dtColumns[] = [
    {
      title: '',
      data: 'id',
      width: '0px',
    },
    {
      title: 'Nom',
      data: 'customer',
      width: '100px',
    },
    {
      title: 'Cups',
      data: 'cups',
      width: '100px',
    },
    {
      title: 'Proveïdor',
      data: 'provider',
      width: '100px',
    },
    {
      title: 'Comunitat',
      data: 'community',
      width: '100px',
    },
    {
      title: 'Municipi',
      data: 'municipality',
      width: '100px',
    },
    {
      title: 'Distribució comunitaria',
      data: 'surplus_distribution',
      width: '100px',
    },
    {
      title: 'Actiu',
      data: 'active',
      width: '100px',
    },
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
        title: 'Customer',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'Cups',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'Provider',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'Community',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'Municipality',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'surplus',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },

      {
        title: 'active',
        description: '',
        value: '',
        type: 2,
        defaultData: 1,
        binarySelector:true,
        defaultTranslation:["Actiu","Inactiu"],
        options: [
          {
            name: "",
            value: ""
          },
          {
            name: "Inactiu",
            value: "0"
          },
          {
            name: "Actiu",
            value: "1"
          },
        ]
      },
  ];

  columnDefs:any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
     {
      targets: 0,
      orderable: false,
      render: (data: any, type: any, row: any) => {
        return ``
      }
    },
   /* {
      targets: 5,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },*/
    {
      targets: 7,
      render: (data: any, type: any, row: any) => {
        // Variable para almacenar el estilo del círculo
        let circleStyle = '';
        console.log(data)
        // Asignar el estilo de acuerdo al valor de los datos
        switch (data) {
          case 'Inactiu':
            circleStyle = 'background-color: red;';
            break;
          case 'Actiu':
            circleStyle = 'background-color: green;';
            break;
          default:
            circleStyle = '';
        }

        // Generar HTML con el círculo y la fecha
        return `<div class="w-100">
                        <div class="mx-auto" style="width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; ${circleStyle}"></div>
                    </div>`;
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
    }
  ];

  editRequest(id:any) {
    const modalRef = this.ngbModal.open(CupsFormComponent);
    modalRef.componentInstance.setEditingId(parseInt(id));

    this.subscriptions.push(
      modalRef.closed.subscribe(() => this.datatable.updateTable()),
    )
  }

  async deleteRequest(id:any) {
    const response = await Swal.fire({
      icon: 'warning',
      title: `Estàs a punt d'esborrar el registre`,
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
