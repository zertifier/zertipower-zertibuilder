import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommunitiesRoutingModule } from './communities-routing.module';
import { CommunitiesTableComponent } from "./communities-table/communities-table.component";
import { CommunitiesFormComponent } from "./communities-form/communities-form.component";
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';


@NgModule({
  declarations: [CommunitiesTableComponent, CommunitiesFormComponent],
  imports: [
    CommonModule,
    CommunitiesRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class CommunitiesModule { }
