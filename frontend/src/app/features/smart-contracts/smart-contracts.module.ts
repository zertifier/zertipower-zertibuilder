import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SmartContractsRoutingModule } from './smart-contracts-routing.module';
import { SmartContractsTableComponent } from "./smart-contracts-table/smart-contracts-table.component";
import { SmartContractsFormComponent } from "./smart-contracts-form/smart-contracts-form.component";
import { SharedComponentsModule } from "src/app/shared/infrastructure/components/shared-components.module";
import { CoreComponentsModule } from "src/app/core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [SmartContractsTableComponent, SmartContractsFormComponent],
  imports: [
    CommonModule,
    SmartContractsRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class SmartContractsModule { }
