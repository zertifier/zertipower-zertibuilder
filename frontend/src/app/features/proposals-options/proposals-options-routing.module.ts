import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProposalsOptionsTableComponent } from "./proposals-options-table/proposals-options-table.component";

const routes: Routes = [
  {
    path: '',
    component: ProposalsOptionsTableComponent
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
export class ProposalsOptionsRoutingModule { }
