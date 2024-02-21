import { Injectable } from '@angular/core';
import {ObservableUtils} from "../../../shared/domain/ObservableUtils";
import {AuthApiService} from "./auth-api.service";
import {AuthStoreService} from "./auth-store.service";

@Injectable({
  providedIn: 'root'
})
export class LoginActionService {

  constructor(
    private authApi: AuthApiService,
    private authStore: AuthStoreService
  ) { }

  async run(user: string, password: string) {
    const response = await ObservableUtils.toPromise(
      this.authApi.web2Login({
        user: user,
        password: password,
      })
    );
    const access_token = response.access_token;
    const refresh_token = response.refresh_token;

    this.authStore.setTokens(access_token, refresh_token);
  }
}
