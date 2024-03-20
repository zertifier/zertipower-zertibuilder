import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {Observable} from 'rxjs';
import {CustomersApiService} from '../customers.service';
import moment from 'moment';

@Component({
  selector: 'customers-form',
  templateUrl: './customers-form.component.html',
  styleUrls: ['./customers-form.component.scss'],
})
export class CustomersFormComponent {
  tinymceConfig = {
    language: 'es',
    language_url: '/assets/tinymce/langs/es.js',
    plugins: 'lists link image table code help wordcount',
    toolbar:
      'blocks bold italic forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'image table | ' +
      'removeformat help',
    base_url: '/assets/tinymce',
    suffix: '.min',
    height: 200,
    statusbar: false,
    menubar: false,
    promotion: false
  }
  id: number = 0;
  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    name: new FormControl<string | null>(null),
    walletAddress: new FormControl<string | null>(null),
    createdAt: new FormControl<string | null>(null),
    updatedAt: new FormControl<string | null>(null),
  });

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CustomersApiService,
    private activeModal: NgbActiveModal,
  ) {
  }

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {
      this.form.controls.id.setValue(data.id);
      this.form.controls.name.setValue(data.name);
      this.form.controls.walletAddress.setValue(data.walletAddress);
      this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));
    });
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

  getValues(): any {
    const values: any = {};

    // values.id = this.form.value.id;
    values.name = this.form.value.name;
    values.walletAddress = this.form.value.walletAddress;
    // values.createdAt = this.form.value.createdAt;
    // values.updatedAt = this.form.value.updatedAt;

    return values;
  }

  checkFormValid() {
    if (!this.form.value.name) return {status: false, message: "El nom del client no pot estar buit"}

    return {status: true, message: ''}
  }
}
