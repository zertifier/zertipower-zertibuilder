import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { CalendarApiService } from '../calendar.service';
import moment from 'moment';

@Component({
  selector: 'calendar-form',
  templateUrl: './calendar-form.component.html',
  styleUrls: ['./calendar-form.component.scss'],
})
export class CalendarFormComponent {
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
    day: new FormControl<string | null>(null),
    weekday: new FormControl<string | null>(null),
    dayType: new FormControl<string | null>(null),
    festiveType: new FormControl<string | null>(null),
    festivity: new FormControl<string | null>(null),
  });
  constructor(
    private formBuilder: FormBuilder,
    private apiService: CalendarApiService,
    private activeModal: NgbActiveModal,
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {
      this.form.controls.day.setValue(moment.utc(data.day).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.weekday.setValue(data.weekday);
      this.form.controls.dayType.setValue(data.dayType);
      this.form.controls.festiveType.setValue(data.festiveType);
      this.form.controls.festivity.setValue(data.festivity);
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

    values.day = this.form.value.day;
    values.weekday = this.form.value.weekday;
    values.dayType = this.form.value.dayType;
    values.festiveType = this.form.value.festiveType;
    values.festivity = this.form.value.festivity;

    return values;
  }
}
