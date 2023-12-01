import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {Observable} from 'rxjs';
import {EnergyRegistersHourlyApiService} from '../energy-registers-hourly.service';
import moment from 'moment';

@Component({
    selector: 'energy-registers-hourly-form',
    templateUrl: './energy-registers-hourly-form.component.html',
    styleUrls: ['./energy-registers-hourly-form.component.scss'],
})
export class EnergyRegistersHourlyFormComponent {
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
        cupsId: new FormControl<number | null>(null),
        import: new FormControl<number | null>(null),
        consumption: new FormControl<number | null>(null),
        export: new FormControl<number | null>(null),
        generation: new FormControl<number | null>(null),
        surplus: new FormControl<number | null>(null),
        consumptionPrice: new FormControl<number | null>(null),
        generationPrice: new FormControl<number | null>(null),
        consumptionCost: new FormControl<number | null>(null),
        generationCost: new FormControl<number | null>(null),
    });

    constructor(
        private formBuilder: FormBuilder,
        private apiService: EnergyRegistersHourlyApiService,
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
            this.form.controls.cupsId.setValue(data.cupsId);
            this.form.controls.import.setValue(data.import);
            this.form.controls.consumption.setValue(data.consumption);
            this.form.controls.export.setValue(data.export);
            this.form.controls.generation.setValue(data.generation);
            this.form.controls.surplus.setValue(data.surplus);
            this.form.controls.consumptionPrice.setValue(data.consumptionPrice);
            this.form.controls.generationPrice.setValue(data.generationPrice);
            this.form.controls.consumptionCost.setValue(data.consumptionCost);
            this.form.controls.generationCost.setValue(data.generationCost);
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
        values.infoDt = this.form.value.infoDt;
        values.cupsId = this.form.value.cupsId;
        values.import = this.form.value.import;
        values.consumption = this.form.value.consumption;
        values.export = this.form.value.export;
        values.generation = this.form.value.generation;
        values.surplus = this.form.value.surplus;
        values.consumptionCost = this.form.value.consumptionCost;
        values.generationCost = this.form.value.generationCost;
        values.consumptionPrice = this.form.value.consumptionPrice;
        values.generationPrice = this.form.value.generationPrice;
        return values;
    }
}
