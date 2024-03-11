import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import {DashboardRoutingModule} from "./dashboard.routing.module";
import {FormsModule} from "@angular/forms";
import { SharedComponentsModule } from 'src/app/shared/infrastructure/components/shared-components.module';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    CoreComponentsModule,
    DashboardRoutingModule,
    FormsModule,
    SharedComponentsModule
  ]
})
export class DashboardModule {
}
