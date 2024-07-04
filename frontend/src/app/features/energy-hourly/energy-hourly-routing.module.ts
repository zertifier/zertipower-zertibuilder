import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyHourlyTableComponent } from "./energy-hourly-table/energy-hourly-table.component";

const routes: Routes = [
  {
    path: '',
    component: EnergyHourlyTableComponent
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
export class EnergyHourlyRoutingModule { }
