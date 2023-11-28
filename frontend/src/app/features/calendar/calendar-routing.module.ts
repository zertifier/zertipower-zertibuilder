import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarTableComponent } from "./calendar-table/calendar-table.component";

const routes: Routes = [
  {
    path: '',
    component: CalendarTableComponent
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule { }
