import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal, NgbModalConfig  } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { CommunitiesFormComponent } from '../communities-form/communities-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { CommunitiesApiService } from '../communities.service';
import moment from 'moment';

@Component({
  selector: 'communities-table',
  templateUrl: './communities-table.component.html',
  styleUrls: ['./communities-table.component.scss'],
})
export class CommunitiesTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: CommunitiesApiService,
    private config: NgbModalConfig
  ) {
    this.config.size = 'lg';
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'communities';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/communities/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Id',
      data: 'id',
      width: '100px',
    },
    {
      title: 'Name',
      data: 'name',
      width: '100px',
    },
    {
      title: 'Test',
      data: 'test',
      width: '100px',
    },
    {
      title: 'CreatedAt',
      data: 'created_at',
      width: '100px',
    },
    {
      title: 'UpdatedAt',
      data: 'updated_at',
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
        title: 'name',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'test',
        description: '',
        value: '',
        type: 2,
        defaultData: 1,
        "binarySelector":true,
        "defaultTranslation":["yes","no"],
        "options":
          [
            {
              "name": "",
              "value": ""
            },
            {
              "name": "yes",
              "value": "1"
            },
            {
              "name": "no",
              "value": "0"
            }
          ]
      },
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
      },
  ];

  columnDefs:any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 3,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
      }
    },
    {
      targets: 4,
      render: (data: any, type: any, row: any) => {
        return `<i class="fa-solid fa-calendar-days"></i> ${moment(data).format('YYYY-MM-DD')} <i class="fa-solid fa-clock"></i> ${moment(data).format('HH:mm')}`
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
    const modalRef = this.ngbModal.open(CommunitiesFormComponent,{fullscreen: true});
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
