import { Test, TestingModule } from '@nestjs/testing';
import { SaveUserAction } from './save-user-action';

describe('SaveUserAction', () => {
  let provider: SaveUserAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaveUserAction],
    }).compile();

    provider = module.get<SaveUserAction>(SaveUserAction);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
