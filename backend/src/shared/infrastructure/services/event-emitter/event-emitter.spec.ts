import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter } from "./event-emitter";

describe("EventEmitter", () => {
  let provider: EventEmitter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventEmitter],
    }).compile();

    provider = module.get<EventEmitter>(EventEmitter);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
