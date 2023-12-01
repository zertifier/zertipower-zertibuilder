import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyRegistersHourlyTableComponent } from "./energy-registers-hourly-table/energy-registers-hourly-table.component";

const routes: Routes = [
  {
    path: '',
    component: EnergyRegistersHourlyTableComponent
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
export class EnergyRegistersHourlyRoutingModule { }
