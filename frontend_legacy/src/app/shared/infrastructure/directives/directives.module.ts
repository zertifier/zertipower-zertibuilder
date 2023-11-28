import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InputCopyDirective } from "./input-copy/input-copy.directive";
import { InputHideDirective } from "./input-copy/input-hide.directive";

@NgModule({
	declarations: [InputCopyDirective, InputHideDirective],
	exports: [InputCopyDirective, InputHideDirective],
	imports: [CommonModule],
})
export class DirectivesModule {}
