import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CupsRoutingModule } from './cups-routing.module';
import { CupsTableComponent } from "./cups-table/cups-table.component";
import { CupsFormComponent } from "./cups-form/cups-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import {NgSelectModule} from "@ng-select/ng-select";


@NgModule({
  declarations: [CupsTableComponent, CupsFormComponent],
    imports: [
        CommonModule,
        CupsRoutingModule,
        SharedComponentsModule,
        CoreComponentsModule,
        ReactiveFormsModule,
        EditorComponent,
        FormsModule,
        NgSelectModule
    ]
})
export class CupsModule { }
