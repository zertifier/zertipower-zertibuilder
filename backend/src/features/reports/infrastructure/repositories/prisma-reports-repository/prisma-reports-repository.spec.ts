import { Test, TestingModule } from '@nestjs/testing';
import { PrismaReportsRepository } from './prisma-reports-repository';

describe('PrismaReportsRepository', () => {
  let provider: PrismaReportsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaReportsRepository],
    }).compile();

    provider = module.get<PrismaReportsRepository>(PrismaReportsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
