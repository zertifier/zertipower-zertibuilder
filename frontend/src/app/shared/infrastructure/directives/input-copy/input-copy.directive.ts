import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from "@angular/core";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";

@Directive({
	selector: "[appInputCopy]",
	hostDirectives: [
		{
			directive: NgbTooltip,
			inputs: ["ngbTooltip: tooltip"],
		},
	],
})
export class InputCopyDirective implements OnInit {
	constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

	ngOnInit(): void {
		const element = this.elementRef.nativeElement;
		if (element.tagName.toLowerCase() !== "input") {
			throw new Error("InputCopyDirective can only be applied to an input element");
		}

		const copyButton = this.renderer.createElement("button");
		this.renderer.setAttribute(copyButton, "type", "button");
		copyButton.innerHTML = '<i class="fa-solid fa-copy"></i>';

		this.renderer.appendChild(this.elementRef.nativeElement.parentNode, copyButton);
		["btn", "btn-secondary"].forEach((value) => {
			this.renderer.addClass(copyButton, value);
		});

		this.renderer.listen(copyButton, "click", () => {
			this.copyContent();
		});
	}

	@HostListener("click")
	async copyContent() {
		const inputValue = this.elementRef.nativeElement.value as string;
		await navigator.clipboard.writeText(inputValue);
	}
}
