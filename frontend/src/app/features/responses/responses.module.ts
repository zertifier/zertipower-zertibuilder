import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResponesesRoutingModule } from './responeses-routing.module';
import { ResponsesTableComponent } from "./responses-table/responses-table.component";
import { ResponsesFormComponent } from "./responses-form/responses-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [ResponsesTableComponent, ResponsesFormComponent],
  imports: [
    CommonModule,
    ResponesesRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class ResponsesModule { }
