import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { ProposalsApiService } from '../proposals.service';
import moment from 'moment';

@Component({
  selector: 'proposals-options-form',
  templateUrl: './proposals-form.component.html',
  styleUrls: ['./proposals-form.component.scss'],
})
export class ProposalsFormComponent {
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
    proposal: new FormControl<string | null>(null),
    description: new FormControl<string | null>(null),
    communityId: new FormControl<number | null>(null),
    expirationDt: new FormControl<string | null>(null),
    status: new FormControl<string | null>(null),
    daoId: new FormControl<number | null>(null),
  });
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ProposalsApiService,
    private activeModal: NgbActiveModal,
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {
      this.form.controls.proposal.setValue(data.proposal);
      this.form.controls.description.setValue(data.description);
      this.form.controls.communityId.setValue(data.communityId);
      this.form.controls.expirationDt.setValue(moment.utc(data.expirationDt).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.status.setValue(data.status);
      this.form.controls.daoId.setValue(data.daoId);
    });
  }

  save() {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Form not valid'
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

    values.proposal = this.form.value.proposal;
    values.description = this.form.value.description;
    values.communityId = this.form.value.communityId;
    values.expirationDt = this.form.value.expirationDt;
    values.status = this.form.value.status;
    values.daoId = this.form.value.daoId;

    return values;
  }
}
