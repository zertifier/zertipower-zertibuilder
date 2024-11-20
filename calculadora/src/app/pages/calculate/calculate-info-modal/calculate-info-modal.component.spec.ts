import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculateInfoModalComponent } from './calculate-info-modal.component';

describe('CalculateInfoModalComponent', () => {
  let component: CalculateInfoModalComponent;
  let fixture: ComponentFixture<CalculateInfoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculateInfoModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalculateInfoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
