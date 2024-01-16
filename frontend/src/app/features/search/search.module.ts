import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import {FormsModule} from "@angular/forms";
import {SearchRoutingModule} from "./search.routing-module";
import {SearchComponent} from "./search-component/search.component";

@NgModule({
  declarations: [SearchComponent],
  imports: [
    CommonModule,
    CoreComponentsModule,
    SearchRoutingModule,
    FormsModule
  ]
})
export class SearchModule {
}
