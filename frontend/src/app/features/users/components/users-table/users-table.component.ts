import { AfterViewInit, Component, OnDestroy, Renderer2, ViewChild } from "@angular/core";
import { commonSettings } from "../../../../shared/infrastructure/datatables/commonSettings";
import { UserApiService } from "../../services/user-api.service";
import { UserStoreService } from "../../services/user-store.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserFormComponent } from "../user-form/user-form.component";
import { DataTableDirective } from "angular-datatables";
import { Subscription } from "rxjs";
import { UserEventEmitterService } from "../../services/user-event-emitter.service";
import { ById } from "../../../../shared/domain/criteria/common/ById";
import { ObservableUtils } from "../../../../shared/domain/ObservableUtils";
import Swal from "sweetalert2";

@Component({
	selector: "app-users-table",
	templateUrl: "./users-table.component.html",
	styleUrls: ["./users-table.component.scss"],
})
export class UsersTableComponent implements AfterViewInit, OnDestroy {
	@ViewChild(DataTableDirective, { static: false })
	datatableElement!: DataTableDirective;

	dtOptions: DataTables.Settings = {
		...commonSettings,
		columns: [
			{ title: "Actions", data: "id" },
			{ title: "Usuario", data: "username" },
			{ title: "Email", data: "email" },
			{ title: "Role", data: "role" },
			{ title: "Wallet address", data: "wallet_address" },
		],
		ajax: (parameters, callback) => {
			this.userApi.datatables(parameters).subscribe(callback);
		},
		columnDefs: [
			{
				targets: [0],
				render: (data, type, row) => {
					return `
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary action-btn" data-edit-action="edit" data-row-id="${row.id}"">
                    <i class="fa-solid fa-pen-to-square" data-edit-action="edit" data-row-id="${row.id}"></i>
                </button>
                <button class="btn btn-sm btn-danger action-btn" data-edit-action="delete" data-row-id="${row.id}">
                    <i class="fa-solid fa-xmark" data-edit-action="delete" data-row-id="${row.id}"></i>
                </button>
              </div>
            `;
				},
			},
			{
				targets: [4],
				render: (data, type, row) => {
					return `<code data-copy="${data}" class="bg-light p-1 rounded">${
						data || "not assigned"
					}</code> <i data-copy="${data}" class="fa-solid fa-copy"></i>`;
				},
			},
		],
	};
	listeners: (() => void)[] = [];
	subscriptions: Subscription[] = [];

	constructor(
		private userApi: UserApiService,
		private renderer: Renderer2,
		private userStore: UserStoreService,
		private ngbModal: NgbModal,
		private userEventEmitter: UserEventEmitterService,
	) {}

	ngAfterViewInit() {
		this.subscriptions.push(
			this.userEventEmitter.userSaved.listen(() => this.refreshDatatable()),
			this.userEventEmitter.userUpdated.listen(() => this.refreshDatatable()),
			this.userEventEmitter.userRemoved.listen(() => this.refreshDatatable()),
		);
		this.listeners.push(
			this.renderer.listen(document, "click", (event) => {
				if (!event.target.hasAttribute("data-row-id")) {
					return;
				}

				const actionType = event.target.getAttribute("data-edit-action");
				const userID = event.target.getAttribute("data-row-id");

				switch (actionType) {
					case "edit":
						this.editUser(parseInt(userID));
						break;
					case "delete":
						this.deleteUser(parseInt(userID));
						break;
				}
			}),
			this.renderer.listen(document, "click", (event) => {
				if (!event.target.hasAttribute("data-copy")) {
					return;
				}

				navigator.clipboard.writeText(event.target.getAttribute("data-copy"));
			}),
		);
	}

	editUser(id: number) {
		this.userStore.editingUserId.set(id);
		this.ngbModal.open(UserFormComponent);
	}

	async deleteUser(id: number) {
		const response = await Swal.fire({
			icon: "question",
			title: "Are you sure?",
			showCancelButton: true,
		});
		if (!response.isConfirmed) {
			return;
		}
		await ObservableUtils.toPromise(this.userApi.deleteUser(new ById(id)));
		this.userEventEmitter.userRemoved.emit();
	}

	ngOnDestroy() {
		this.listeners.forEach((listener) => listener());
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private async refreshDatatable() {
		const dtInstance = await this.datatableElement.dtInstance;
		dtInstance.ajax.reload();
	}
}
