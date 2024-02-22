import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { dtColumns } from "src/app/shared/infrastructure/components/app-datatable/interfaces/dtColumns.interface";
import { filterParams } from "src/app/shared/infrastructure/components/app-datatable/interfaces/filterParams.interface";
import { environment } from 'src/environments/environment';
import { Subscription } from "rxjs";
import { AppDatatableComponent } from 'src/app/shared/infrastructure/components/app-datatable/app-datatable.component';
import Swal from 'sweetalert2';
import moment from 'moment';
import { AuthStoreService } from '../auth/services/auth-store.service';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { LoginActionService } from '../auth/services/login-action.service';

@Component({
  selector: 'login-map',
  templateUrl: './login-map.component.html',
  styleUrls: ['./login-map.component.scss'],
})
export class LoginMapComponent {
  
  formGroup = this.formBuilder.group({
    user: new FormControl<string | null>(null, Validators.required),
    password: new FormControl<string | null>(null),
});

  constructor(
    public authStoreService: AuthStoreService,
    private formBuilder: FormBuilder,
    private loginAction: LoginActionService
    ) {

  }

  async loginByType(type: 'google' | 'github' | 'twitter') {
    switch (type) {
      case "google":
        await this.authStoreService.loginWithGoogle()
        await this.login()
        console.log(await this.authStoreService.ethereumSigner())
        break;
      case "github":
        await this.authStoreService.loginWithGithub()
        await this.login()
        break;
      case "twitter":
        await this.authStoreService.loginWithTwitter()
        await this.login()
        break;

      default:
        return
    }
  }

  async login() {
    if (this.formGroup.invalid) {
        throw new Error("Invalid form");
    }

    const { user, password } = this.formGroup.value;

    await this.loginAction.run(user!, password || "");
}

}