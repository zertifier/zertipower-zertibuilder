import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import {FormsModule} from "@angular/forms";
import {SearchRoutingModule} from "./search.routing-module";
import {SearchComponent} from "./search-component/search.component";
import {AppMapComponent} from "../../shared/infrastructure/components/map/map.component";
import {GoogleMap} from "@angular/google-maps";
import { SharedComponentsModule } from 'src/app/shared/infrastructure/components/shared-components.module';
import { TooltipModule } from 'src/app/shared/infrastructure/directives/tooltip/tooltip.module';

@NgModule({
  declarations: [SearchComponent,AppMapComponent],
  imports: [
    CommonModule,
    CoreComponentsModule,
    SearchRoutingModule,
    FormsModule,
    GoogleMap,
    SharedComponentsModule,
    TooltipModule
  ]
})
export class SearchModule {
}
