import { TextShortenerPipe } from "./text-shortener.pipe";

describe("TextShortenerPipe", () => {
	it("create an instance", () => {
		const pipe = new TextShortenerPipe();
		expect(pipe).toBeTruthy();
	});
});
