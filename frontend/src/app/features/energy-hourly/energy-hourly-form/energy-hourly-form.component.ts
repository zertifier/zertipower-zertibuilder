import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {Observable} from 'rxjs';
import {EnergyHourlyApiService} from '../energy-hourly.service';
import moment from 'moment';

@Component({
    selector: 'energy-hourly-form',
    templateUrl: './energy-hourly-form.component.html',
    styleUrls: ['./energy-hourly-form.component.scss'],
})
export class EnergyHourlyFormComponent {
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
        infoDt: new FormControl<string | null>(null),
        cups: new FormControl<string | null>(null),
        kwhIn: new FormControl<number | null>(null),
        kwhOut: new FormControl<number | null>(null),
        kwhOutVirtual: new FormControl<number | null>(null),
        kwhInPrice: new FormControl<number | null>(null),
        kwhOutPrice: new FormControl<number | null>(null),
        shares: new FormControl<number | null>(null),
        type: new FormControl<string | null>(null),
        origin: new FormControl<string | null>(null),
      });

    constructor(
        private formBuilder: FormBuilder,
        private apiService: EnergyHourlyApiService,
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
            this.form.controls.infoDt.setValue(moment.utc(data.infoDt).format('YYYY-MM-DDTHH:mm'));
            this.form.controls.cups.setValue(data.cups);
            this.form.controls.kwhIn.setValue(data.kwhIn);
            this.form.controls.kwhOut.setValue(data.kwhOut);
            this.form.controls.kwhOutVirtual.setValue(data.kwhOutVirtual);
            this.form.controls.kwhInPrice.setValue(data.kwhInPrice);
            this.form.controls.kwhOutPrice.setValue(data.kwhOutPrice);
            this.form.controls.shares.setValue(data.shares);
            this.form.controls.type.setValue(data.type);
            this.form.controls.origin.setValue(data.origin);
          });
    }

     save() {
    //     if (this.form.invalid) {
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Form not valid'
    //         });
    //         return;
    //     }
    //     const values = this.getValues();
    //     let request: Observable<any>;
    //     if (!this.id) {
    //         request = this.apiService.save(values);
    //     } else {
    //         request = this.apiService.update(this.id, values);
    //     }
    //     request.subscribe(() => {
    //         Swal.fire({
    //             icon: 'success',
    //             title: 'Success!'
    //         });
    //         this.activeModal.close();
    //     });
     }

    cancel() {
        this.activeModal.dismiss();
    }

    getValues(): any {
        const values: any = {};
    
        values.id = this.form.value.id;
        values.infoDt = this.form.value.infoDt;
        values.cups = this.form.value.cups;
        values.kwhIn = this.form.value.kwhIn;
        values.kwhOut = this.form.value.kwhOut;
        values.kwhOutVirtual = this.form.value.kwhOutVirtual;
        values.kwhInPrice = this.form.value.kwhInPrice;
        values.kwhOutPrice = this.form.value.kwhOutPrice;
        values.shares = this.form.value.shares;
        values.type = this.form.value.type;
        values.origin = this.form.value.origin;
        return values;
      }
}
