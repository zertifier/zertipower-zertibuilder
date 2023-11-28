import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnergyBlocksRoutingModule } from './energy-blocks-routing.module';
import { EnergyBlocksTableComponent } from "./energy-blocks-table/energy-blocks-table.component";
import { EnergyBlocksFormComponent } from "./energy-blocks-form/energy-blocks-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [EnergyBlocksTableComponent, EnergyBlocksFormComponent],
  imports: [
    CommonModule,
    EnergyBlocksRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class EnergyBlocksModule { }
