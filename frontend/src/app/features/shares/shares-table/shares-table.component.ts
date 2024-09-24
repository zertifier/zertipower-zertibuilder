import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharesService } from '../shares.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { SharesFormComponent } from '../shares-form/shares-form.component';
import { dtColumns } from 'src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface';
import { filterParams } from 'src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface';

@Component({
  selector: 'app-shares-table',
  templateUrl: './shares-table.component.html',
  styleUrl: './shares-table.component.scss'
})
export class SharesTableComponent {

  @ViewChild(AppDatatableComponent) datatable!: AppDatatableComponent;

  constructor(private ngbModal: NgbModal, private apiService: SharesService) { }

  readonly subscriptions: Array<Subscription> = []
  title: string = 'Participacions';
  addRows: boolean = true;
  editRows: boolean = true;
  refreshRows: boolean = true;
  filterColumns: boolean = true;
  url: string = `${environment.api_url}/shares/datatable`;

  columns: dtColumns[] = [
    {
      title: 'Id',
      data: 'id',
      width: '100px',
    },
    {
      title: 'Client',
      data: 'customer_name',
      width: '100px',
    },
    {
      title: 'Comunitat',
      data: 'community_name',
      width: '100px',
    },
    {
      title: 'Betas',
      data: 'shares',
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
      title: 'id',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: 'customer_name',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'community_name',
      description: '',
      value: '',
      type: 0,
      defaultData: 0,
      options: [],
    },
    {
      title: 'shares',
      description: '',
      value: '',
      type: 1,
      defaultData: 0,
      options: [],
    },
    {
      title: "status",
      description: "",
      value: "",
      type: 2,
      defaultData: 1,
      binarySelector: true,
      defaultTranslation: ["Pendent", "Actiu", "Inactiu"],
      options: [
        {
          name: "Pendent",
          value: "PENDING"
        },
        {
          name: "Actiu",
          value: "ACTIVE"
        },
        {
          name: "Inactiu",
          value: "INACTIVE"
        }
      ]
    }
  ]

  columnDefs: any[] = [
    {
      orderable: false, targets: [this.filterParams.length],
    },
    {
      targets: 3,
      render: (data: any, type: any, row: any) => {
        return `${Number(data).toFixed(2)}`
      }
    },
    {
      targets: 4,
      render: (data: any, type: any, row: any) => {
        switch (data) {
          case 'ACTIVE':
            return `Actiu`
          case 'INACTIVE':
            return `Inactiu`
          case 'PENDING':
            return `Pendent`
          default:
            return `-`
        }
        
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
    const modalRef = this.ngbModal.open(SharesFormComponent);
    modalRef.componentInstance.setEditingId(parseInt(id));

    this.subscriptions.push(
      modalRef.closed.subscribe(() => this.datatable.updateTable()),
    )
  }

  async deleteRequest(id: any) {
    const response = await Swal.fire({
      icon: 'question',
      title: 'Segur que vol esborrar el registre?',
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