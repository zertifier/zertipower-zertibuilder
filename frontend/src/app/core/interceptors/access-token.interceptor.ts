import { Injectable } from "@angular/core";
import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from "@angular/common/http";
import { catchError, EMPTY, Observable, switchMap, throwError } from "rxjs";
import { AuthStoreService } from "../../features/auth/services/auth-store.service";
import { ErrorCode } from "../../shared/domain/ErrorCode";
import { AuthApiService } from "../../features/auth/services/auth-api.service";
import { Router } from "@angular/router";

export const InterceptorSkipHeader = "X-Skip-Interceptor";

@Injectable()
export class AccessTokenInterceptor implements HttpInterceptor {
	constructor(private authStore: AuthStoreService, private authApi: AuthApiService,private router: Router) {}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		if (request.headers.has(InterceptorSkipHeader)) {
			const headers = request.headers.delete(InterceptorSkipHeader);
			return next.handle(request.clone({ headers }));
		}

		const accessToken = this.authStore.accessToken();
		const headers = request.headers.append("Authorization", `Bearer ${accessToken}`);
		return next.handle(request.clone({ headers })).pipe(
			catchError((err) => {
				if (err instanceof HttpErrorResponse) {
					if (err.error.error_code !== ErrorCode.UNAUTHORIZED) {
						console.log(err.error)
						// this.authStore.logout()
						// this.router.navigate(["/auth"]);
						return throwError(() => err);
					}
				}
				console.log("sale del catch")
				const refreshToken = this.authStore.refreshToken()!;
				return this.authApi.refreshToken(refreshToken).pipe(
					switchMap((response) => {
						const headers = request.headers.append(
							"Authorization",
							`Bearer ${response.access_token}`,
						);
						console.log("sale bien?")
						return next.handle(request.clone({ headers }));
					}),
					catchError(() => {
						console.log("2nd error")
						this.authApi.logout(refreshToken).subscribe(this.authStore.logout);
						return EMPTY;
					}),
				);
			}),
		);
	}
}
