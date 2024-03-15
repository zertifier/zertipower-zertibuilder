import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { EnergyTransactionsApiService } from '../energy-transactions.service';
import moment from 'moment';
import {CupsApiService, CupsInterface} from "../../cups/cups.service";

@Component({
  selector: 'energy-transactions-form',
  templateUrl: './energy-transactions-form.component.html',
  styleUrls: ['./energy-transactions-form.component.scss'],
})
export class EnergyTransactionsFormComponent {
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
    cupsId: new FormControl<number | null>(null),
    infoDt: new FormControl<string | null>(null),
    kwhIn: new FormControl<number | null>(null),
    kwhOut: new FormControl<number | null>(null),
    kwhSurplus: new FormControl<number | null>(null),
    blockId: new FormControl<number | null>(null),
    createdAt: new FormControl<string | null>(null),
    updatedAt: new FormControl<string | null>(null),
  });

  availableCups: any;
  selectedCupId: number = 0
  constructor(
    private formBuilder: FormBuilder,
    private apiService: EnergyTransactionsApiService,
    private cupsApiService: CupsApiService,
    private activeModal: NgbActiveModal,
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.cupsApiService.get().subscribe((cups) => {
      this.availableCups = cups
      this.apiService.getById(id).subscribe((data) => {
        this.form.controls.id.setValue(data.id);
        // this.form.controls.cupsId.setValue(data.cupsId);
        this.form.controls.cupsId.setValue(data.cupsId);
        this.selectedCupId = data.cupsId
        this.form.controls.infoDt.setValue(moment.utc(data.infoDt).format('YYYY-MM-DDTHH:mm'));
        this.form.controls.kwhIn.setValue(data.kwhIn);
        this.form.controls.kwhOut.setValue(data.kwhOut);
        this.form.controls.kwhSurplus.setValue(data.kwhSurplus);
        this.form.controls.blockId.setValue(data.blockId);
        this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
        this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));
      });
    })

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
    values.cupsId = this.form.value.cupsId;
    values.infoDt = this.form.value.infoDt;
    values.kwhIn = this.form.value.kwhIn;
    values.kwhOut = this.form.value.kwhOut;
    values.kwhSurplus = this.form.value.kwhSurplus;
    values.blockId = this.form.value.blockId;
    values.createdAt = this.form.value.createdAt;
    values.updatedAt = this.form.value.updatedAt;

    return values;
  }
}
