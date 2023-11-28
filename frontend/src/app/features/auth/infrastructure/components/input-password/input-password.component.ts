import { Component, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
	selector: "app-input-password",
	templateUrl: "./input-password.component.html",
	styleUrls: ["./input-password.component.scss"],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: InputPasswordComponent,
		},
	],
})
export class InputPasswordComponent implements ControlValueAccessor {
	hide = signal(true);
	value: string | null = null;
	changed!: (value: any) => void;
	disabled!: boolean;

	touched: () => void = () => {};

	toggleHide() {
		this.hide.update((current) => !current);
	}

	registerOnChange(fn: any): void {
		this.changed = (event: any) => fn(event.target.value);
	}

	registerOnTouched(fn: any): void {
		this.touched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	writeValue(value: string | null): void {
		this.value = value;
	}
}
