import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {SearchComponent} from "./search.component";
import {GoogleMap} from "@angular/google-maps";
import { TooltipModule } from '../../directives/tooltip/tooltip.module';
import { AppMapComponent } from '../../components/map/map.component';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { ComponentsModule } from '../../components/components.module';
import { HttpClientModule } from '@angular/common/http';

const routes: Routes = [
  {
    path: '',
    component: SearchComponent
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];

@NgModule({
  declarations: [SearchComponent,AppMapComponent],
    imports: [
        CommonModule,
        FormsModule,
        GoogleMap,
        TooltipModule,
        NgbModule,
        ComponentsModule,
        RouterModule.forChild(routes)
    ]
})
export class SearchModule {
}
