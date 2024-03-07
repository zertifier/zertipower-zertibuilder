import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import { LogsComponent } from './logs/logs.component';
import { LogsRoutingModule } from './logs.routing.module';
import { LogsFormComponent } from './logs-form/logs-form.component';


@NgModule({
  declarations: [LogsComponent,LogsFormComponent],
  imports: [
    CommonModule,
    LogsRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class LogsModule { }