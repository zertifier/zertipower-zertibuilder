import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import {DashboardRoutingModule} from "./dashboard.routing.module";
@NgModule({
  declarations: [ DashboardComponent],
  imports: [
    CommonModule,
    CoreComponentsModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
