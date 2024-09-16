import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {AppChartComponent} from "./chart/chart.component";
import {GoogleMap} from "@angular/google-maps";
import { QuestionBadgeComponent } from "./question-badge/question-badge.component";

@NgModule({
	declarations: [AppChartComponent],
	exports: [AppChartComponent],
	imports: [CommonModule,GoogleMap],
})
export class ComponentsModule {}
