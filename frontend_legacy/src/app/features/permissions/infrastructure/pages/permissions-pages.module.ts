import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { PermissionsPagesRoutingModule } from "./permissions-pages-routing.module";
import { PermissionsListPageComponent } from "./permissions-list-page/permissions-list-page.component";
import { CoreComponentsModule } from "../../../../core/core-components/core-components.module";
import {
	NgbAccordionBody,
	NgbAccordionButton,
	NgbAccordionCollapse,
	NgbAccordionDirective,
	NgbAccordionHeader,
	NgbAccordionItem,
	NgbTooltip,
} from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";

@NgModule({
	declarations: [PermissionsListPageComponent],
	imports: [
		CommonModule,
		PermissionsPagesRoutingModule,
		CoreComponentsModule,
		NgbAccordionDirective,
		NgbAccordionItem,
		NgbAccordionHeader,
		NgbAccordionButton,
		NgbAccordionCollapse,
		NgbAccordionBody,
		FormsModule,
		NgbTooltip,
	],
})
export class PermissionsPagesModule {}
