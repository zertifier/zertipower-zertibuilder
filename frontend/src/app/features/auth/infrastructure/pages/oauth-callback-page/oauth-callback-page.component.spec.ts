import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OauthCallbackPageComponent } from './oauth-callback-page.component';

describe('OauthCallbackPageComponent', () => {
  let component: OauthCallbackPageComponent;
  let fixture: ComponentFixture<OauthCallbackPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OauthCallbackPageComponent]
    });
    fixture = TestBed.createComponent(OauthCallbackPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
