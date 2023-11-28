import { Test, TestingModule } from '@nestjs/testing';
import { CreateDefaultUserTask } from './create-default-user-task.service';

describe('CreateDefaultUserAction', () => {
  let provider: CreateDefaultUserTask;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateDefaultUserTask],
    }).compile();

    provider = module.get<CreateDefaultUserTask>(CreateDefaultUserTask);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
