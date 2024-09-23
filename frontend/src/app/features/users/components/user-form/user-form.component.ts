import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { UserStoreService } from "../../services/user-store.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AuthStoreService } from "../../../auth/services/auth-store.service";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { UserApiService } from "../../services/user-api.service";
import { ObservableUtils } from "../../../../shared/domain/ObservableUtils";
import { UserEventEmitterService } from "../../services/user-event-emitter.service";
import { ById } from "../../../../shared/domain/criteria/common/ById";
import { UserRoleApiService } from "../../services/user-role-api.service";
import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { CustomersApiService } from "src/app/features/customers/customers.service";

@Component({
	selector: "app-user-form",
	templateUrl: "./user-form.component.html",
	styleUrls: ["./user-form.component.scss"],
})
export class UserFormComponent implements OnInit, OnDestroy {
	editing = false;
	availableRoles = signal<Array<string>>([]);
	walletInstalled = this.authStore.ethereumProviderInstalled;
	firstAttempt = signal(true);
	formGroup = this.formBuilder.group({
		username: new FormControl<string | null>(null, Validators.required),
		email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
		firstname: new FormControl<string | null>(null, Validators.required),
		lastname: new FormControl<string | null>(null, Validators.required),
		customerId: new FormControl<number | null>(null),
		wallet: new FormControl<string | null>(null, Validators.pattern(/^0x\w{40}$/)),
		password: new FormControl<string | null>(null),
		role: new FormControl<string | null>(null, Validators.required),
	});
	availableCustomers:any[]=[];
	selectedCustomerId!: number;

	constructor(
		private userStore: UserStoreService,
		private ngbActiveModal: NgbActiveModal,
		private authStore: AuthStoreService,
		private formBuilder: FormBuilder,
		private userApi: UserApiService,
		private userEventEmitter: UserEventEmitterService,
		private userRoleApi: UserRoleApiService,
		private customerApiService: CustomersApiService
	) {
		this.editing = !!userStore.editingUserId();
		if (!this.editing) {
			this.formGroup.controls.password.addValidators(Validators.required);
		}
	}

	async ngOnInit() {
		const roles = await ObservableUtils.toPromise(this.userRoleApi.get(Criteria.none()));
		this.availableRoles.set(roles.map((role:any) => role.name));

		this.customerApiService.get().subscribe((customers:any) => {
			this.availableCustomers = customers
		})

		if (!this.userStore.editingUserId()) {
			return;
		}

		const fetchedUsers = await ObservableUtils.toPromise(
			this.userApi.getUsers(new ById(this.userStore.editingUserId()!)),
		);

		const user = fetchedUsers[0];

		if (!user) {
			this.ngbActiveModal.close();
			throw new Error("User not found");
		}

		console.log(user)

		if(user.customer_id){
			this.selectedCustomerId=user.customer_id;
		}

		this.formGroup.controls.username.setValue(user.username);
		this.formGroup.controls.firstname.setValue(user.firstname);
		this.formGroup.controls.lastname.setValue(user.lastname);
		this.formGroup.controls.wallet.setValue(user.wallet_address);
		this.formGroup.controls.customerId.setValue(user.customer_id!);
		this.formGroup.controls.email.setValue(user.email);
		this.formGroup.controls.role.setValue(user.role);
	}

	async fillWallet() {
		if (!this.authStore.ethereumProviderInstalled()) {
			return;
		}

		if (!this.authStore.ethereumSigner()) {
			await this.authStore.connectMetamask();
		}

		const signer = this.authStore.ethereumSigner()!;
		const address = await signer.getAddress();
		this.formGroup.controls.wallet.setValue(address);
	}

	async save() {
		if (this.formGroup.invalid) {
			this.firstAttempt.set(false);
			throw new Error("Form not valid");
		}

		const { username, role, firstname, lastname, wallet, customerId, email, password } = this.formGroup.value;

		if (!this.editing) {
			try {
				await ObservableUtils.toPromise(
					this.userApi.saveUser({
						username: username!,
						email: email!,
						firstname: firstname!,
						lastname: lastname!,
						password: password!,
						customer_id:customerId!,
						wallet_address: wallet || undefined,
						role: role!,
					}),
				);
				this.userEventEmitter.userSaved.emit();
			} catch (err) {
				this.firstAttempt.set(false);
				throw err;
			}
		} else {
			try {
				await ObservableUtils.toPromise(
					this.userApi.updateUser(
						{
							username: username!,
							email: email!,
							firstname: firstname!,
							lastname: lastname!,
							password: password || undefined,
							wallet_address: wallet || undefined,
							customer_id:customerId || undefined,
							role: role!
						},
						this.userStore.editingUserId()!,
					),
				);
				this.userEventEmitter.userUpdated.emit();
			} catch (err) {
				this.firstAttempt.set(false);
				throw err;
			}
		}

		this.ngbActiveModal.close();
	}

	cancel() {
		this.ngbActiveModal.close();
	}

	ngOnDestroy() {
		this.userStore.editingUserId.set(undefined);
	}
}
