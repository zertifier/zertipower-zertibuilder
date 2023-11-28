import { inject } from "@angular/core";
import { AuthStoreService } from "../services/auth-store/auth-store.service";
import { Router } from "@angular/router";

export const loggedIn: () => boolean = () => {
	const authStore = inject(AuthStoreService);
	const router = inject(Router);

	if (!authStore.user()) {
		router.navigate(["auth"]);
	}

	return !!authStore.user();
};

export const loggedOut: () => boolean = () => {
	const authStore = inject(AuthStoreService);

	const router = inject(Router);
	if (authStore.user()) {
		router.navigate(["users"]);
	}

	return !authStore.user();
};
