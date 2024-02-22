import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthStoreService} from "../../services/auth-store.service";

@Component({
  selector: 'app-oauth-callback-page',
  templateUrl: './oauth-callback-page.component.html',
  styleUrls: ['./oauth-callback-page.component.scss']
})
export class OauthCallbackPageComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private authStore: AuthStoreService,
    private router: Router
  ) {
  }

  ngOnInit() {
    const accessToken = this.activatedRoute.snapshot.queryParams['access_token'];
    const refreshToken = this.activatedRoute.snapshot.queryParams['refresh_token'];
    if (!accessToken || !refreshToken) {
      this.router.navigate(['/auth/login']);
    }
    this.authStore.setTokens(accessToken, refreshToken);
    this.router.navigate(['']);
  }

}
