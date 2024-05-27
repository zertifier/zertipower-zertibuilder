import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProposalsRoutingModule } from './proposals-routing.module';
import { ProposalsTableComponent } from "./proposals-table/proposals-table.component";
import { ProposalsFormComponent } from "./proposals-form/proposals-form.component";
import { SharedComponentsModule } from "src/app/shared/infrastructure/components/shared-components.module";
import { CoreComponentsModule } from "src/app/core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [ProposalsTableComponent, ProposalsFormComponent],
  imports: [
    CommonModule,
    ProposalsRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class ProposalsModule { }
