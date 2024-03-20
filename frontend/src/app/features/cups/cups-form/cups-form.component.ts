import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { CupsApiService } from '../cups.service';
import moment from 'moment';
import {CustomersApiService} from "../../customers/customers.service";
import {ProvidersApiService} from "../../providers/providers.service";
import {CommunitiesApiService} from "../../communities/communities.service";
import {LocationService} from "../../../core/core-services/location.service";

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
    datadisActive:new FormControl<boolean>(false),
    datadisUser: new FormControl<string | null>(null),
    datadisPwd: new FormControl<string | null>(null),
    smartMeterActive:new FormControl<boolean>(false),
    smartMeterModel:new FormControl<string|null>(null),
    smartMeterApiKey:new FormControl<string|null>(null),
    inverterActive:new FormControl<boolean>(false),
    inverterModel:new FormControl<string|null>(null),
    inverterApiKey:new FormControl<string|null>(null),
    sensorActive:new FormControl<boolean>(false),
    sensorModel:new FormControl<string|null>(null),
    sensorApiKey:new FormControl<string|null>(null),
  });

  smartMeterModels=['Fronius 63A-3','Fronius TS 100A-1','SMETS 1','SMETS 2']
  inverterModels=['Turbo Energy 5000W 48V','Soiis S6-GR1P5K Monofásico 2MPPT 5000W','Huawei SUN2000-6KTL-L1 6kW']
  sensorModels=['iEM2000','PowerLogic PM5000']

  availableCustomers: any;
  availableProviders: any;
  availableCommunities: any;
  availableLocations: any;
  selectedCustomerId!: number;
  selectedProviderId!: number
  selectedCommunityId!: number;
  selectedLocationId!: number;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CupsApiService,
    private activeModal: NgbActiveModal,
    private customerApiService: CustomersApiService,
    private providerApiService: ProvidersApiService,
    private communitiesApiService: CommunitiesApiService,
    private locationsApiService: LocationService,
  ) {
    this.getAvailableDropdownData()

  }

  setEditingId(id: number) {
    this.id = id;
    if (!this.id) {
      return;
    }

    this.apiService.getById(id).subscribe((data) => {
      console.log(data, "DATA")
      this.form.controls.id.setValue(data.id);
      this.form.controls.cups.setValue(data.cups);
      this.form.controls.type.setValue(data.type);
      this.form.controls.providerId.setValue(data.providerId);
      this.form.controls.communityId.setValue(data.communityId);
      this.form.controls.locationId.setValue(data.locationId);
      this.form.controls.address.setValue(data.address);
      this.form.controls.lat.setValue(data.lat);
      this.form.controls.lng.setValue(data.lng);
      this.form.controls.datadisActive.setValue(data.datadisActive);
      this.form.controls.smartMeterActive.setValue(data.smartMeterActive);
      this.form.controls.inverterActive.setValue(data.inverterActive);
      this.form.controls.datadisUser.setValue(data.datadisUser);
      // this.form.controls.datadisPwd.setValue(data.datadisPassword);
      this.form.controls.smartMeterModel.setValue(data.smartMeterModel);
      this.form.controls.smartMeterApiKey.setValue(data.smartMeterApiKey);
      this.form.controls.inverterModel.setValue(data.inverterModel);
      this.form.controls.inverterApiKey.setValue(data.inverterApiKey);
      this.form.controls.sensorActive.setValue(data.sensorActive);
      this.form.controls.sensorModel.setValue(data.sensorModel);
      this.form.controls.sensorApiKey.setValue(data.sensorApiKey);
      this.form.controls.customerId.setValue(data.customerId);
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
    values.cups = this.form.value.cups;
    values.providerId = this.form.value.providerId;
    values.communityId = this.form.value.communityId;
    values.locationId = this.form.value.locationId;
    values.customerId = this.form.value.customerId;
    values.lat = this.form.value.lat;
    values.lng = this.form.value.lng;
    values.address = this.form.value.address;
    values.type = this.form.value.type;
    values.datadisActive = this.form.value.datadisActive
    values.smartMeterActive = this.form.value.smartMeterActive
    values.inverterActive = this.form.value.inverterActive
    values.datadisUser = this.form.value.datadisUser
    values.datadisPassword = this.form.value.datadisPwd
    values.smartMeterModel = this.form.value.smartMeterModel || ''
    values.smartMeterApiKey = this.form.value.smartMeterApiKey
    values.inverterModel = this.form.value.inverterModel
    values.inverterApiKey = this.form.value.inverterApiKey
    values.sensorActive = this.form.value.sensorActive
    values.sensorModel = this.form.value.sensorModel
    values.sensorApiKey = this.form.value.sensorApiKey

/*    values.createdAt = this.form.value.createdAt;
    values.updatedAt = this.form.value.updatedAt;*/

    return values;
  }

  getAvailableDropdownData(){
    this.providerApiService.get().subscribe((providers) => {
      this.availableProviders = providers
    })
    this.communitiesApiService.get().subscribe((communities: any) => {
      this.availableCommunities = communities.data
    })
    this.locationsApiService.getLocations().subscribe((locations: any) => {
      this.availableLocations = locations.data
    })
    this.customerApiService.get().subscribe((customers) => {
      this.availableCustomers = customers

    })
  }

  checkFormValid(){
    if (!this.form.value.cups) return {status: false, message: "El nom pot estar buit"}

    if (!this.selectedCustomerId) return {status: false, message: "El client pot estar buit"}

    if (!this.selectedProviderId) return {status: false, message: "El proveïdor pot estar buit"}

    if (!this.selectedCommunityId) return {status: false, message: "La comunitat no pot estar buida"}

    if (!this.selectedLocationId) return {status: false, message: "L'ubicació no pot estar buida"}

    if (!this.form.value.address) return {status: false, message: "L'adreça no pot estar buida"}

    return {status: true, message: ''}
  }
}
