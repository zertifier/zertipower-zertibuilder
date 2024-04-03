import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProposalsTableComponent } from "./proposals-table/proposals-table.component";

const routes: Routes = [
  {
    path: '',
    component: ProposalsTableComponent
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
export class ProposalsRoutingModule { }
