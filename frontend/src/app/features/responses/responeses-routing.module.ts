import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResponsesTableComponent } from "./responses-table/responses-table.component";

const routes: Routes = [
  {
    path: '',
    component: ResponsesTableComponent
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
export class ResponesesRoutingModule { }
