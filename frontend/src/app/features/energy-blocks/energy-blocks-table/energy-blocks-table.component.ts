import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams, filterType } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { EnergyBlocksFormComponent } from '../energy-blocks-form/energy-blocks-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { EnergyBlocksApiService } from '../energy-blocks.service';
import moment from 'moment';

@Component({
  selector: 'energy-blocks-table',
  templateUrl: './energy-blocks-table.component.html',
  styleUrls: ['./energy-blocks-table.component.scss'],
})
export class EnergyBlocksTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: EnergyBlocksApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'Trams energètics';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/energy-blocks/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Id',
      data: 'id',
      width: '100px',
    },
    {
      title: 'Referència',
      data: 'reference',
      width: '100px',
    },
    {
      title: 'Proveïdor',
      data: 'provider',
      width: '100px',
    },
    {
      title: `Data d'expiració`,
      data: 'expiration_dt',
      width: '100px',
    },
    {
      title: `Inici d'activitat`,
      data: 'active_init',
      width: '100px',
    },
    {
      title: `Fi d'activitat`,
      data: 'active_end',
      width: '100px',
    },
    {
      title: 'Preu de consum',
      data: 'consumption_price',
      width: '100px',
    },
    {
      title: `Preu d'exportació`,
      data: 'generation_price',
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
      title: 'reference',
      description: '',
      value: '',
      type: 2,
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
      title: 'provider',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'expiration_dt',
      description: '',
      value: '',
      type:  filterType.datetime,
      defaultData: 0,
      options: [],
    },
    {
      title: 'active_init',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'active_end',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'consumption_price',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'generation_price',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
  ];

  columnDefs: any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 1,
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
    {
      targets: 3,
      render: (data: any, type: any, row: any) => {
        // return `<i class="fa-solid fa-clock"></i> ${data}`
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')}<br> <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
      targets: 4,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-clock"></i> ${data}`
      }
    },
    {
      targets: 5,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-clock"></i> ${data}`
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

  editRequest(id: any) {

    const modalRef = this.ngbModal.open(EnergyBlocksFormComponent);
    modalRef.componentInstance.setEditingId(parseInt(id));

    this.subscriptions.push(
      modalRef.closed.subscribe(() => this.datatable.updateTable()),
    )

  }

  async deleteRequest(id: any) {
    const response = await Swal.fire({
      icon: 'warning',
      title: `Estàs a punt d'esborrar el registre`,
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
