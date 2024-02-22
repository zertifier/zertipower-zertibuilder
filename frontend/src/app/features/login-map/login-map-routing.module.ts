import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginMapComponent } from './login-map.component';

const routes: Routes = [
  {
    path: '',
    component: LoginMapComponent
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
export class LoginMapRoutingModule { }
