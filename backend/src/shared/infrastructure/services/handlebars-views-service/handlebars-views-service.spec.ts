import { Test, TestingModule } from '@nestjs/testing';
import { HandlebarsViewsService } from './handlebars-views.service';
import { ConfigEnvironmentService } from '../config-environment-service/config-environment.service';

describe('ViewsService', () => {
  let provider: HandlebarsViewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HandlebarsViewsService, ConfigEnvironmentService],
    }).compile();

    provider = module.get<HandlebarsViewsService>(HandlebarsViewsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
