import { TestBed } from '@angular/core/testing';

import { LoginActionService } from './login-action.service';

describe('LoginActionService', () => {
  let service: LoginActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
