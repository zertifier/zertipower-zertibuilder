import { Injectable, signal } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class UserStoreService {
	public readonly editingUserId = signal<number | undefined>(undefined);
}
