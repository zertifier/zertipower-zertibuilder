import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnergyRegistersRoutingModule } from './energy-registers-routing.module';
import { EnergyRegistersTableComponent } from "./energy-registers-table/energy-registers-table.component";
import { EnergyRegistersFormComponent } from "./energy-registers-form/energy-registers-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import {NgSelectModule} from "@ng-select/ng-select";


@NgModule({
  declarations: [EnergyRegistersTableComponent, EnergyRegistersFormComponent],
    imports: [
        CommonModule,
        EnergyRegistersRoutingModule,
        SharedComponentsModule,
        CoreComponentsModule,
        ReactiveFormsModule,
        EditorComponent,
        NgSelectModule
    ]
})
export class EnergyRegistersModule { }
