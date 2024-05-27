import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipComponent } from "./tooltip/tooltip.component";
import { TooltipModule } from "ng-bootstrap";

@NgModule({
	declarations: [TooltipModule],
	exports: [TooltipModule],
	imports: [CommonModule],
})
export class DirectivesModule {}
