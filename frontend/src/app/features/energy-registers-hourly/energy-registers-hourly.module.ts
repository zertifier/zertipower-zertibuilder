import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  EnergyRegistersHourlyRoutingModule
} from './energy-registers-hourly-routing.module';
import { EnergyRegistersHourlyTableComponent } from "./energy-registers-hourly-table/energy-registers-hourly-table.component";
import { EnergyRegistersHourlyFormComponent } from "./energy-registers-hourly-form/energy-registers-hourly-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';

@NgModule({
  declarations: [EnergyRegistersHourlyTableComponent, EnergyRegistersHourlyFormComponent],
  imports: [
    CommonModule,
    EnergyRegistersHourlyRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class EnergyRegistersHourlyModule { }
