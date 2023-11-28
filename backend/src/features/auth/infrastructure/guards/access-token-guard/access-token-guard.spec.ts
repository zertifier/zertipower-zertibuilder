import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenGuard } from './access-token-guard';

describe('AccessTokenGuard', () => {
  let provider: AccessTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokenGuard],
    }).compile();

    provider = module.get<AccessTokenGuard>(AccessTokenGuard);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
