import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import moment from 'moment';
import { LogsService } from 'src/app/core/core-services/logs-service';

@Component({
  selector: 'logs-form',
  templateUrl: './logs-form.component.html'
})
export class LogsFormComponent {

    id: number = 0;
    keys:any = [];
    values:any = [];
   
  constructor(
    private activeModal: NgbActiveModal,
    private logsService:LogsService
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.logsService.byId(this.id).subscribe((res:any)=>{
        this.keys=Object.keys(res.data)
        this.values=Object.values(res.data)
    })
  }

  save() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }

  getValues(): any {
    const values: any = {};
    return values;
  }
}
