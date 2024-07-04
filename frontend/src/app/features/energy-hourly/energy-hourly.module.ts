import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  EnergyHourlyRoutingModule
} from './energy-hourly-routing.module';
import { EnergyHourlyTableComponent } from "./energy-hourly-table/energy-hourly-table.component";
import { EnergyHourlyFormComponent } from "./energy-hourly-form/energy-hourly-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';

@NgModule({
  declarations: [EnergyHourlyTableComponent, EnergyHourlyFormComponent],
  imports: [
    CommonModule,
    EnergyHourlyRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class EnergyHourlyModule { }
