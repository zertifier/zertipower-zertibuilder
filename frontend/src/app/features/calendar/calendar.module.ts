import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarTableComponent } from "./calendar-table/calendar-table.component";
import { CalendarFormComponent } from "./calendar-form/calendar-form.component";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorComponent } from '@tinymce/tinymce-angular';
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";


@NgModule({
  declarations: [CalendarTableComponent, CalendarFormComponent],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule,
    EditorComponent
  ]
})
export class CalendarModule { }
