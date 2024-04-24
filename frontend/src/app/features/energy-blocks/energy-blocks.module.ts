import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnergyBlocksRoutingModule } from './energy-blocks-routing.module';
import { EnergyBlocksTableComponent } from "./energy-blocks-table/energy-blocks-table.component";
import { EnergyBlocksFormComponent } from "./energy-blocks-form/energy-blocks-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
  declarations: [EnergyBlocksTableComponent, EnergyBlocksFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    EnergyBlocksRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent,
    NgSelectModule
  ]
})
export class EnergyBlocksModule { }
