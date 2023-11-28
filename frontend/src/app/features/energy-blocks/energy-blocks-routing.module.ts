import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyBlocksTableComponent } from "./energy-blocks-table/energy-blocks-table.component";

const routes: Routes = [
  {
    path: '',
    component: EnergyBlocksTableComponent
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
export class EnergyBlocksRoutingModule { }
