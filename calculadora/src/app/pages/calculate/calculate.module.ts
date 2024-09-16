import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {GoogleMap} from "@angular/google-maps";
import { TooltipModule } from '../../directives/tooltip/tooltip.module';
import { AppMapComponent } from '../../components/map/map.component';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { ComponentsModule } from '../../components/components.module';
import { HttpClientModule } from '@angular/common/http';
import { CalculateComponent } from './calculate.component';
import { QuestionBadgeComponent } from '../../components/question-badge/question-badge.component';

const routes: Routes = [
  {
    path: '',
    component: CalculateComponent
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];

@NgModule({
  declarations: [CalculateComponent,AppMapComponent],
    imports: [
        CommonModule,
        FormsModule,
        GoogleMap,
        NgbModule,
        ComponentsModule,
        QuestionBadgeComponent,
        RouterModule.forChild(routes)
    ]
})
export class CalculateModule {
}
