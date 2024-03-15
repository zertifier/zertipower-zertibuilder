import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { ProvidersApiService } from '../providers.service';
import moment from 'moment';

@Component({
  selector: 'providers-form',
  templateUrl: './providers-form.component.html',
  styleUrls: ['./providers-form.component.scss'],
})
export class ProvidersFormComponent {
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
    provider: new FormControl<string | null>(null),
  });
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ProvidersApiService,
    private activeModal: NgbActiveModal,
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {
      console.log(data, "DATA")
      this.form.controls.id.setValue(data.id);
      this.form.controls.provider.setValue(data.provider);
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

    values.id = this.form.value.id;
    values.provider = this.form.value.provider;

    return values;
  }
}
