import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyTransactionsTableComponent } from "./energy-transactions-table/energy-transactions-table.component";

const routes: Routes = [
  {
    path: '',
    component: EnergyTransactionsTableComponent
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
export class EnergyTransactionsRoutingModule { }
