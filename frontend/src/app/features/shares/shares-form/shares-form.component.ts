import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl } from '@angular/forms';
import { SharesService } from '../shares.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommunitiesApiService } from '../../communities/communities.service';
import { CustomersService } from 'src/app/core/core-services/customers.service';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-shares-form',
  templateUrl: './shares-form.component.html',
  styleUrl: './shares-form.component.scss'
})
export class SharesFormComponent {

  id: number = 0;
  communities:any[]=[];
  customers:any[]=[];
  
  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    community_id:  new FormControl<number | null>(null),
    customer_id: new FormControl<number | null>(null),
    shares: new FormControl<number | null>(0),
    status: new FormControl<string | null>(null)
  });

  formChecked:boolean=false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: SharesService,
    private activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private communityService:CommunitiesApiService,
    private customerService:CustomersService
  ) {

    this.communityService.get().subscribe((data:any)=>{
      this.communities=data.data;
    })

    this.customerService.getCustomers().subscribe((data:any)=>{
      this.customers=data.data;
    })

  }

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data:any) => {
      this.form.controls.id.setValue(data.id);
      this.form.controls.community_id.setValue(data.communityId);
      this.form.controls.customer_id.setValue(data.customerId);
      this.form.controls.shares.setValue(data.shares);
      this.form.controls.status.setValue(data.status);
    });

  }

  getValues(): any {
    const values: any = {};

    values.communityId = this.form.value.community_id;
    values.customerId = this.form.value.customer_id;
    values.shares = this.form.value.shares;
    values.status = this.form.value.status;

    return values;
  }

  checkFormValid() {
    this.formChecked = true
    if (!this.form.value.community_id) return {status: false, message: "El camp de comunitat no pot quedar buit"}
    if (!this.form.value.customer_id) return {status: false, message: "El camp de client no pot quedar buit"}
    if (!(this.form.value.shares! >= 0)) return {status: false, message: "El camp de betas no pot quedar buit"}
    if (!this.form.value.status) return {status: false, message: "El camp d'estat no pot quedar buit"}
    return {status: true, message: ''}
  }

  save() {
    const validFormObj = this.checkFormValid()
    if (!validFormObj.status) {
      Swal.fire({
        icon: 'error',
        title: validFormObj.message,
      });
      return;
    }
    const values = this.getValues();
    let request: Observable<any>;
    if (!this.id) {
      request = this.apiService.save(values);
    } else {
      request = this.apiService.update(this.id, values);
    }
    request.subscribe(() => {
      Swal.fire({
        icon: 'success',
        title: 'Success!'
      });
      this.activeModal.close();
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }

}
