import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharesTableComponent } from './shares-table/shares-table.component';

const routes: Routes = [
  {
    path: '',
    component: SharesTableComponent
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
export class SharesRoutingModule { }
