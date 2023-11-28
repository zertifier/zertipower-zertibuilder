import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnergyTransactionsRoutingModule } from './energy-transactions-routing.module';
import { EnergyTransactionsTableComponent } from "./energy-transactions-table/energy-transactions-table.component";
import { EnergyTransactionsFormComponent } from "./energy-transactions-form/energy-transactions-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [EnergyTransactionsTableComponent, EnergyTransactionsFormComponent],
  imports: [
    CommonModule,
    EnergyTransactionsRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class EnergyTransactionsModule { }
