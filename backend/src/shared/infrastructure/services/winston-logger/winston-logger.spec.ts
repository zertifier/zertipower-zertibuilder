import { Test, TestingModule } from '@nestjs/testing';
import { WinstonLogger } from './winston-logger.service';

describe('Logger', () => {
  let provider: WinstonLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLogger],
    }).compile();

    provider = module.get<WinstonLogger>(WinstonLogger);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
