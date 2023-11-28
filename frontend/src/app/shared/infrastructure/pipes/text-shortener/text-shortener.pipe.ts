import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "textShortener",
})
export class TextShortenerPipe implements PipeTransform {
	transform(value: string, initialOffset = 0, length = 3, endOffset = 0): string {
		return `${value.slice(0, length + initialOffset)}...${value.slice(
			value.length - (length + endOffset),
			value.length,
		)}`;
	}
}
