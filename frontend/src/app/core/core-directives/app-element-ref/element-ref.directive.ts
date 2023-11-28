import { Directive, ElementRef } from "@angular/core";

@Directive({
	selector: "[appElementRef]",
})
export class ElementRefDirective {
	constructor(public readonly elementRef: ElementRef) {}
}
