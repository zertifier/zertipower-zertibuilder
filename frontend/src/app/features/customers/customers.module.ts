import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersTableComponent } from "./customers-table/customers-table.component";
import { CustomersFormComponent } from "./customers-form/customers-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import { CupsFormComponent } from '../cups/cups-form/cups-form.component';


@NgModule({
  declarations: [CustomersTableComponent, CustomersFormComponent],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class CustomersModule { }
