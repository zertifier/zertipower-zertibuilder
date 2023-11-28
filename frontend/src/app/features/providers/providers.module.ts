import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProvidersRoutingModule } from './providers-routing.module';
import { ProvidersTableComponent } from "./providers-table/providers-table.component";
import { ProvidersFormComponent } from "./providers-form/providers-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [ProvidersTableComponent, ProvidersFormComponent],
  imports: [
    CommonModule,
    ProvidersRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class ProvidersModule { }
