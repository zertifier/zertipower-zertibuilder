import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProposalsOptionsRoutingModule } from './proposals-options-routing.module';
import { ProposalsOptionsTableComponent } from "./proposals-options-table/proposals-options-table.component";
import { ProposalsOptionsFormComponent } from "./proposals-options-form/proposals-options-form.component";
import { SharedComponentsModule } from "src/app/shared/infrastructure/components/shared-components.module";
import { CoreComponentsModule } from "src/app/core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [ProposalsOptionsTableComponent, ProposalsOptionsFormComponent],
  imports: [
    CommonModule,
    ProposalsOptionsRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class ProposalsOptionsModule { }
