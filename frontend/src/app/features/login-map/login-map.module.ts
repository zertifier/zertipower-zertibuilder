import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedComponentsModule} from "../../shared/infrastructure/components/shared-components.module";
import {CoreComponentsModule} from "../../core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { LoginMapComponent } from './login-map.component';

@NgModule({
  declarations: [LoginMapComponent],
  imports: [
    CommonModule,
    SharedComponentsModule,
    CoreComponentsModule,
    ReactiveFormsModule
  ]
})
export class LoginMapModule { }
