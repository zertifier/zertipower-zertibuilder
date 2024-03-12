import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "./navbar/navbar.component";
import { RouterLink, RouterLinkActive } from "@angular/router";
import {
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle, NgbTooltip,
} from "@ng-bootstrap/ng-bootstrap";

@NgModule({
	declarations: [NavbarComponent],
	exports: [NavbarComponent],
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        NgbTooltip,
    ],
})
export class CoreComponentsModule {}
