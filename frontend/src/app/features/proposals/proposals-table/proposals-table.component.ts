import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { ProposalsFormComponent } from '../proposals-form/proposals-form.component';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import { ProposalsApiService } from '../proposals.service';
import moment from 'moment';

@Component({
  selector: 'proposals-options-table',
  templateUrl: './proposals-table.component.html',
  styleUrls: ['./proposals-table.component.scss'],
})
export class ProposalsTableComponent implements OnDestroy {
  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(
    private ngbModal: NgbModal,
    private apiService: ProposalsApiService,
  ) {
  }

  readonly subscriptions: Array<Subscription> = []

  title: string = 'proposals';
  addRows: boolean = false;
  editRows: boolean = false;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/proposals/datatable`;
  columns: dtColumns[] = [
    {
      title: 'Proposta',
      data: 'proposal',
      width: '100px',
    },
    {
      title: 'Descripció',
      data: 'description',
      width: '100px',
    },
    {
      title: 'Comunitat',
      data: 'name',
      width: '100px',
    },
    {
      title: 'Data expiració',
      data: 'expiration_dt',
      width: '100px',
    },
    {
      title: 'Estat',
      data: 'status',
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
        title: 'proposal',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'description',
        description: '',
        value: '',
        type: 0,
        defaultData: 0,
        options: [],
      },
      {
        title: 'community_id',
        description: '',
        value: '',
        type: 1,
        defaultData: 0,
        options: [],
      },
      {
        title: 'expiration_dt',
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
        type: 0,
        defaultData: 0,
        options: [],
      }
  ];

  columnDefs:any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 3,
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
    }
  ];

  editRequest(id:any) {
    const modalRef = this.ngbModal.open(ProposalsFormComponent);
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
