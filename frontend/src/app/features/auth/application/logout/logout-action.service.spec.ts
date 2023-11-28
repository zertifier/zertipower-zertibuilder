import { TestBed } from '@angular/core/testing';

import { LogoutActionService } from './logout-action.service';

describe('LoginActionService', () => {
  let service: LogoutActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogoutActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
