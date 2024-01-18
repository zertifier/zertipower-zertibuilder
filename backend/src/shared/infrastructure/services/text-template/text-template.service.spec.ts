import { Test, TestingModule } from "@nestjs/testing";
import { TextTemplateService } from "./text-template.service";

describe("TextTemplateService", () => {
  let service: TextTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextTemplateService],
    }).compile();

    service = module.get<TextTemplateService>(TextTemplateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should parse templates", () => {
    const variables = { destination: "world" };
    const template = "hello {{ destination }}";
    expect(service.parse(template, variables)).toEqual("hello world");
  });
});
