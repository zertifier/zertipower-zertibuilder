import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {firstValueFrom, map} from "rxjs";
import {environment} from "../../../../../../environments/environment";
import {HttpResponse} from "../../../../../shared/infrastructure/http/HttpResponse";
import {InterceptorSkipHeader} from "../../../../../core/interceptors/access-token/access-token.interceptor";

@Injectable({
    providedIn: "root",
})
export class AuthApiService {
    constructor(private httpClient: HttpClient) {
    }

    getSignCode(walletAddress: string) {
        const headers = new HttpHeaders().append(InterceptorSkipHeader, "");
        return this.httpClient
            .post<
                HttpResponse<{
                    code: string;
                }>
            >(`${environment.api_url}/auth/request-code`, {wallet_address: walletAddress}, {headers})
            .pipe(map((response) => response.data.code));
    }

    web3Login(walletAddress: string, signature: string) {
        const headers = new HttpHeaders().append(InterceptorSkipHeader, "");
        return this.httpClient
            .post<
                HttpResponse<{
                    access_token: string;
                    refresh_token: string;
                }>
            >(
                `${environment.api_url}/auth/login-w3`,
                {
                    wallet_address: walletAddress,
                    signature,
                },
                {headers},
            )
            .pipe(map((response) => response.data));
    }

    web2Login(params: { user: string; password: string }) {
        const headers = new HttpHeaders().append(InterceptorSkipHeader, "");
        return this.httpClient
            .post<
                HttpResponse<{
                    access_token: string;
                    refresh_token: string;
                }>
            >(`${environment.api_url}/auth/login`, params, {headers})
            .pipe(map((response) => response.data));
    }

    refreshToken(token: string) {
        const headers = new HttpHeaders().append(InterceptorSkipHeader, "");

        return this.httpClient
            .post<
                HttpResponse<{
                    access_token: string;
                }>
            >(`${environment.api_url}/auth/refresh`, {token}, {headers})
            .pipe(map((response) => response.data));
    }

    logout(token: string) {
        const headers = new HttpHeaders().append(InterceptorSkipHeader, "");
        return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/auth/logout`, {
            body: {token},
            headers,
        });
    }

    requestResetPassword(email: string) {
        return this.httpClient
            .post<HttpResponse<void>>(`${environment.api_url}/auth/request-reset-password`, {email})
            .pipe(map((response) => response.data));
    }

    resetPassword(code: string, password: string) {
        return this.httpClient
            .post<HttpResponse<void>>(`${environment.api_url}/auth/reset-password`, {code, password})
            .pipe(map((response) => response.data));
    }

    async googleSignIn(credential: string) {
        console.log(credential);
        const headers = new HttpHeaders().set(InterceptorSkipHeader, "");
        return firstValueFrom(
            this.httpClient
                .post<HttpResponse<string>>(
                    `${environment.api_url}/oauth/google-callback`,
                    {credential},
                    {headers},
                )
                .pipe(map((response) => response.data))
        );
    }
}
