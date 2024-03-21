import { Component } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { AuthStoreService } from "../../services/auth-store.service";
import { AuthApiService } from "../../services/auth-api.service";
import Swal from "sweetalert2";
import { ObservableUtils } from "../../../../shared/domain/ObservableUtils";
import { RegexUtils } from "../../../../shared/domain/utils/RegexUtils";
import {LoginActionService} from "../../services/login-action.service";

@Component({
	selector: "app-web2-login-form",
	templateUrl: "./web2-login-form.component.html",
	styleUrls: ["./web2-login-form.component.scss"],
})
export class Web2LoginFormComponent {
	formGroup = this.formBuilder.group({
		user: new FormControl<string | null>(null, Validators.required),
		// password: new FormControl<string | null>(null),
    password: [null, [Validators.required, Validators.pattern(/\S/)]]
	});

  loading = false

	constructor(
		private formBuilder: FormBuilder,
		private authStore: AuthStoreService,
		private authApi: AuthApiService,
    private loginAction: LoginActionService,
	) {}

	async login() {
    this.loading = true
		if (this.formGroup.invalid) {
      this.loading = false
			throw new Error("Invalid form");
		}

		const { user, password } = this.formGroup.value;

    try {
      await this.loginAction.run(user!, password || "");

    }catch (e) {
      Swal.fire({
        icon: "error",
        title: "Aquest usuari no existeix",
      });
      this.loading = false
    }

	}

	async requestResetPassword() {
		if (this.formGroup.controls.user.invalid) {
			Swal.fire({
				icon: "error",
				title: "Put your email first",
			});
			return;
		}
		const email = this.formGroup.value.user!;
		if (!RegexUtils.email.test(email)) {
			Swal.fire({
				icon: "error",
				title: "Put a valid email",
			});
			return;
		}

		await ObservableUtils.toPromise(this.authApi.requestResetPassword(email!));
		Swal.fire({
			icon: "success",
			title: "Email sent successfully",
		});
	}


}
