import { Component } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs";
import { AuthApiService } from "../../services/auth-api/auth-api.service";
import { ObservableUtils } from "../../../../../shared/domain/ObservableUtils";

@Component({
	selector: "app-reset-password",
	templateUrl: "./reset-password.component.html",
	styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent {
	form = this.formBuilder.group({
		password1: new FormControl<string | null>(null, [Validators.required]),
		password2: new FormControl<string | null>(null, [Validators.required]),
	});
	firstTry = true;
	code = "";

	constructor(
		private formBuilder: FormBuilder,
		private router: Router,
		private route: ActivatedRoute,
		private authService: AuthApiService,
	) {
		this.route.paramMap.pipe(first()).subscribe((params) => {
			this.code = params.get("code") as string;
		});
	}

	async save() {
		this.firstTry = false;

		if (this.form.invalid) {
			Swal.fire({
				icon: "error",
				title: "Form is not valid",
			});
			return;
		}

		const { password1, password2 } = this.form.value;
		if (!password1 || !password2) {
			Swal.fire({
				icon: "error",
				title: "Missing passwords",
			});
			return;
		}

		await ObservableUtils.toPromise(this.authService.resetPassword(this.code, password1));
		Swal.fire({
			icon: "success",
			title: "Password saved successfully!",
		});
		this.login();
	}

	login() {
		this.router.navigate(["auth/logout"]);
	}
}
