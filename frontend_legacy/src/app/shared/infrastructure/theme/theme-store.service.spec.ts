import { TestBed } from '@angular/core/testing';

import { ThemeStoreService } from './theme-store.service';

describe('ThemeStoreService', () => {
  let service: ThemeStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
