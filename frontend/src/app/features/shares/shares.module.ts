import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import { SharesTableComponent } from './shares-table/shares-table.component';
import { SharesFormComponent } from './shares-form/shares-form.component';
import { SharesRoutingModule } from './shares-routing.module';


@NgModule({
  declarations: [SharesTableComponent, SharesFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharesRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class SharesModule { }