import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { AuthApiService } from "../../services/auth-api.service";
import { ethers } from "ethers";
import { Router } from "@angular/router";
import {AuthStoreService} from "../../services/auth-store.service";
import {environment} from "../../../../../environments/environment";
import {LogoutActionService} from "../../services/logout-action.service";

declare let google: any;

@Component({
	selector: "app-google-signin-button",
	templateUrl: "./google-signin-button.component.html",
	styleUrls: ["./google-signin-button.component.scss"],
})
export class GoogleSigninButtonComponent {

	constructor() {}

	goToGoogleOauth() {
	window.location.replace(`${environment.api_url}/oauth/google`);
	}

}
