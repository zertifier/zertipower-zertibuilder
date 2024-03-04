import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { CupsApiService } from '../cups.service';
import moment from 'moment';

@Component({
  selector: 'cups-form',
  templateUrl: './cups-form.component.html',
  styleUrls: ['./cups-form.component.scss'],
})
export class CupsFormComponent {

  //TODO: update form

  id: number = 0;
  cupsTypes:string[]=['consumer','producer','prosumer']

  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    cups: new FormControl<string | null>(null),
    providerId: new FormControl<number | null>(null),
    communityId: new FormControl<number | null>(null),
    locationId: new FormControl<number | null>(null),
    address: new FormControl<string | null>(null),
    lat: new FormControl<number | null>(null),
    lng: new FormControl<number | null>(null),
    type: new FormControl<string | null>(null),
    customerId: new FormControl<number | null>(null),
    createdAt: new FormControl<string | null>(null),
    updatedAt: new FormControl<string | null>(null),
    datadis:new FormControl<number>(0),
    datadisUser: new FormControl<string | null>(null),
    datadisPwd: new FormControl<string | null>(null),
    smartMeter:new FormControl<number>(0),
    smartMeterModel:new FormControl<string|null>(null),
    smartMeterApiKey:new FormControl<string|null>(null),
    inverter:new FormControl<number>(0),
    inverterModel:new FormControl<string|null>(null),
    inverterApiKey:new FormControl<string|null>(null),
  });

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CupsApiService,
    private activeModal: NgbActiveModal,
  ) {}

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }
    this.apiService.getById(id).subscribe((data) => {

      console.log(data)

      this.form.controls.id.setValue(data.id);
      this.form.controls.cups.setValue(data.cups);
      this.form.controls.type.setValue(data.type);
      this.form.controls.providerId.setValue(data.providerId);
      this.form.controls.communityId.setValue(data.communityId);
      this.form.controls.locationId.setValue(data.locationId);
      this.form.controls.address.setValue(data.address);
      this.form.controls.lat.setValue(data.lat);
      this.form.controls.lng.setValue(data.lng);
      this.form.controls.datadis.setValue(data.datadis);
      this.form.controls.smartMeter.setValue(data.smartMeter);
      this.form.controls.inverter.setValue(data.inverter);
      this.form.controls.datadisUser.setValue(data.datadisUser);
      this.form.controls.datadisPwd.setValue(data.datadisPwd);
      this.form.controls.smartMeterModel.setValue(data.smartMeterModel);
      this.form.controls.smartMeterApiKey.setValue(data.smartMeterApiKey);
      this.form.controls.inverterModel.setValue(data.inverterModel);
      this.form.controls.inverterApiKey.setValue(data.inverterApiKey);
      this.form.controls.customerId.setValue(data.customerId);
      this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));
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
    values.cups = this.form.value.cups;
    values.providerId = this.form.value.providerId;
    values.communityId = this.form.value.communityId;
    values.locationId = this.form.value.locationId;
    values.customerId = this.form.value.customerId;
    values.createdAt = this.form.value.createdAt;
    values.updatedAt = this.form.value.updatedAt;

    return values;
  }
}
