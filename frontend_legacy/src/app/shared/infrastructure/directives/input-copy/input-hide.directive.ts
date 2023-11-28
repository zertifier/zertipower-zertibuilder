import {
	Directive,
	effect,
	EffectRef,
	ElementRef,
	OnDestroy,
	OnInit,
	Renderer2,
	signal,
} from "@angular/core";

@Directive({
	selector: "[appInputHide]",
})
export class InputHideDirective implements OnInit, OnDestroy {
	readonly hide = signal(true);
	icon = this.renderer.createElement("i");
	readonly effects: Array<EffectRef> = [];

	constructor(private elementRef: ElementRef, private renderer: Renderer2) {
		effect(() => {
			// Changing icon
			const hide = this.hide();
			this.renderer.removeClass(this.icon, hide ? "fa-eye" : "fa-eye-slash");
			this.renderer.addClass(this.icon, hide ? "fa-eye-slash" : "fa-eye");

			// Changing text
			this.elementRef.nativeElement.type = hide ? "password" : "text";
		});
	}

	ngOnInit(): void {
		const element = this.elementRef.nativeElement;
		if (element.tagName.toLowerCase() !== "input") {
			throw new Error("InputCopyDirective can only be applied to an input element");
		}

		const hideButton = this.renderer.createElement("button");
		this.renderer.setAttribute(hideButton, "type", "button");
		this.renderer.appendChild(hideButton, this.icon);
		this.renderer.addClass(this.icon, "fa-solid");

		this.renderer.appendChild(this.elementRef.nativeElement.parentNode, hideButton);
		["btn", "btn-secondary"].forEach((value) => {
			this.renderer.addClass(hideButton, value);
		});

		this.renderer.listen(hideButton, "click", () => {
			this.hide.set(!this.hide());
		});
	}

	ngOnDestroy() {
		this.effects.forEach((value) => value.destroy());
	}
}
