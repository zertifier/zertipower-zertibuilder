import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SmartContractsTableComponent } from "./smart-contracts-table/smart-contracts-table.component";

const routes: Routes = [
  {
    path: '',
    component: SmartContractsTableComponent
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
export class SmartContractsRoutingModule { }
