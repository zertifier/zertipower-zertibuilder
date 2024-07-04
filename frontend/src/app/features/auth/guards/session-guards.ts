import { inject } from "@angular/core";
import { AuthStoreService } from "../services/auth-store.service";
import { CanActivateFn, Router } from "@angular/router";

export const loggedIn: CanActivateFn = () => {
	const authStore = inject(AuthStoreService);
	const router = inject(Router);

	// console.log(" logged in ");
	// console.log(!!authStore.user())

	return !!authStore.user() || router.parseUrl("/auth");
};

export const loggedOut: CanActivateFn = () => {
	const authStore = inject(AuthStoreService);

	const router = inject(Router);
	
	return !authStore.user() || router.parseUrl("/dashboard");
};
