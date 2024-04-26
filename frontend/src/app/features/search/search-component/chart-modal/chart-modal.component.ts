import {Component, inject, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SharedComponentsModule} from "../../../../shared/infrastructure/components/shared-components.module";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-chart-modal',
  standalone: true,
  imports: [CommonModule, SharedComponentsModule],
  templateUrl: './chart-modal.component.html',
  styleUrl: './chart-modal.component.scss'
})
export class ChartModalComponent {
  activeModal = inject(NgbActiveModal);
  @Input() labels: any;
  @Input() datasets: any;
  @Input() options: any;
  @Input() updateSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


}
