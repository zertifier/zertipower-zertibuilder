import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {Observable} from 'rxjs';
import {EnergyBlocksApiService} from '../energy-blocks.service';
import moment from 'moment';
import { ProvidersApiService } from '../../providers/providers.service';

@Component({
  selector: 'energy-blocks-form',
  templateUrl: './energy-blocks-form.component.html',
  styleUrls: ['./energy-blocks-form.component.scss'],
})
export class EnergyBlocksFormComponent implements OnInit {

  id: number = 0;

  availableProviders:any[]=[];
  selectedProviderId!: number;

  form = this.formBuilder.group({
    id: new FormControl<number | null>(null),
    reference: new FormControl<string | null>(null),
    providerId:new FormControl<number | null>(null),
    expirationDt: new FormControl<string | null>(null),
    activeInit: new FormControl<string | null>(null),
    activeEnd: new FormControl<string | null>(null),
    // consumptionPrice: new FormControl<number | null>(null),
    consumptionPrice: new FormControl<number | null>(null, Validators.max(100)),
    // generationPrice: new FormControl<number | null>(null),
    generationPrice: new FormControl<number | null>(null, Validators.max(100)),
  });

  constructor(
    private formBuilder: FormBuilder,
    private apiService: EnergyBlocksApiService,
    private activeModal: NgbActiveModal,
    private providersApiService:ProvidersApiService
  ) {
  }

  ngOnInit(): void {

    this.form.get('generationPrice')?.valueChanges.subscribe(value => {
      if (value && (value >= 100 || value == 0)) {
        this.form.get('generationPrice')?.setErrors({'exceedsLimit': true});
      } else {
        this.form.get('generationPrice')?.setErrors(null);
      }
    });

    this.form.get('consumptionPrice')?.valueChanges.subscribe(value => {
      if (value && (value >= 100 || value == 0)) {
        this.form.get('consumptionPrice')?.setErrors({'exceedsLimit': true});
      } else {
        this.form.get('consumptionPrice')?.setErrors(null);
      }
    });

    this.providersApiService.get().subscribe((providers:any) => {
      this.availableProviders = providers;
    })

  }

  setEditingId(id: number) {
    
    this.id = id;

    if (!this.id) {
      return;
    }

    this.apiService.getById(id).subscribe((data) => {
      this.form.controls.id.setValue(data.id);
      this.form.controls.reference.setValue(data.reference);
      this.form.controls.expirationDt.setValue(moment.utc(data.expirationDt).format('YYYY-MM-DDTHH:mm'));
      this.form.controls.activeInit.setValue(moment.utc(data.activeInit).format('HH:mm'));
      this.form.controls.activeEnd.setValue(moment.utc(data.activeEnd).format('HH:mm'));
      this.form.controls.consumptionPrice.setValue(data.consumptionPrice);
      this.form.controls.generationPrice.setValue(data.generationPrice);
      this.form.controls.providerId.setValue(data.providerId);

      this.selectedProviderId = data.providerId

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
    
    this.form.controls.providerId.setValue(this.selectedProviderId)
    console.log(this.selectedProviderId,this.form.controls.providerId.getRawValue())

    const values = this.getValues();

    let request: Observable<any>;
    if (!this.id) {
      request = this.apiService.save(values);
    } else {
      request = this.apiService.update(this.id, values);
    }
    request.subscribe((data) => {
      Swal.fire({
        icon: 'success',
        title: `L'operació s'ha completat amb èxit!`
      });
      this.activeModal.close();
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }

  checkFormValid(){
    if (!this.form.value.reference) return {status: false, message: "La referència no pot estar buida"}

    if (!this.form.value.expirationDt) return {status: false, message: "La data d'expiració no pot estar buida"}

    if (!this.form.value.activeInit) return {status: false, message: "La data d'inici no pot estar buida"}

    if (!this.form.value.activeEnd) return {status: false, message: "La data de fi no pot estar buida"}

    if (this.form.get('consumptionPrice')?.errors) return {status: false, message: 'El preu de consum no pot excedir els 100€'}

    if (this.form.get('generationPrice')?.errors) return  {status: false, message: 'El preu de generació no pot excedir els 100€'}

    return {status: true, message: ''}
  }

  getValues(): any {
    const values: any = {};

    // values.id = this.form.value.id;
    values.reference = this.form.value.reference;
    values.providerId = this.form.value.providerId;
    values.expirationDt = this.form.value.expirationDt;
    values.activeInit = this.form.value.activeInit;
    values.activeEnd = this.form.value.activeEnd;
    values.consumptionPrice = this.form.value.consumptionPrice;
    values.generationPrice = this.form.value.generationPrice;

    return values;
  }
}
