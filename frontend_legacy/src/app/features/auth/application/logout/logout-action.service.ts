import { Injectable } from '@angular/core';
import {AuthStoreService} from "../../infrastructure/services/auth-store/auth-store.service";
import {AuthApiService} from "../../infrastructure/services/auth-api/auth-api.service";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LogoutActionService {

  constructor(private authStore: AuthStoreService, private authApiService: AuthApiService) {}

  async run() {
    const refreshToken = this.authStore.refreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token not defined");
    }
    await firstValueFrom(this.authApiService.logout(refreshToken));
    this.authStore.refreshToken.set(undefined);
    this.authStore.accessToken.set(undefined);
  }
}
