import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { AuthApiService } from "../../services/auth-api.service";
import { ethers } from "ethers";
import { Router } from "@angular/router";
import {AuthStoreService} from "../../services/auth-store.service";
import {environment} from "../../../../../environments/environment";
import {LogoutActionService} from "../../services/logout-action.service";
import {SHA256} from 'crypto-js';

declare let google: any;

@Component({
	selector: "app-google-signin-button",
	templateUrl: "./google-signin-button.component.html",
	styleUrls: ["./google-signin-button.component.scss"],
})
export class GoogleSigninButtonComponent {

	baseUrl: string = "https://auth.zertifier.com"
	appId: string = "0ba3f4b3-55fa-499f-8782-23c81a2b4652" //CHANGE IT TO YOUR APP ID
	redirectUrl: string = window.location.origin+'/auth';

	constructor() {
		console.log(this.redirectUrl)
	}

	goToGoogleOauth() {
	//window.location.replace(`${environment.api_url}/oauth/google`);
	window.location.href = this.getCode('google');
	}
	
	getCode(platform: 'google' | 'twitter' | 'facebook' | 'linkedin' | 'github') {
		const baseCode = this.generateRandomString(32)
		localStorage.setItem('baseCodeChallenge', baseCode);
	
		const codeChallenge = SHA256(baseCode).toString();
	
		const url =
		  `${this.baseUrl}/zauth/oauth/${platform}?app-id=${this.appId}&redirect-url=${this.redirectUrl}&code-challenge=${codeChallenge}&code-challenge-method=S256`
	
		return url
	  }

	  generateRandomString(length: number): string {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const randomChars = Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length)));
	
		return randomChars.join('');;
	  }
}
