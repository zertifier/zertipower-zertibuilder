import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TextShortenerPipe } from "./text-shortener/text-shortener.pipe";

@NgModule({
	declarations: [TextShortenerPipe],
	imports: [CommonModule],
})
export class PipesModule {}
