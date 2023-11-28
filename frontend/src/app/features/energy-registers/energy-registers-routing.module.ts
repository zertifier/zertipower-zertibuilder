import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyRegistersTableComponent } from "./energy-registers-table/energy-registers-table.component";

const routes: Routes = [
  {
    path: '',
    component: EnergyRegistersTableComponent
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
export class EnergyRegistersRoutingModule { }
