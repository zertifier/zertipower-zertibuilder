import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ElementRefDirective } from "./app-element-ref/element-ref.directive";

@NgModule({
	declarations: [ElementRefDirective],
	exports: [ElementRefDirective],
	imports: [CommonModule],
})
export class CoreDirectivesModule {}
