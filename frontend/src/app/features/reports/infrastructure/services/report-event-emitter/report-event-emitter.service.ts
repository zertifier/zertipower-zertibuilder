import { Injectable } from "@angular/core";
import { ReportsServicesModule } from "../reports-services.module";
import { EventSubject } from "../../../../../shared/domain/events/EventSubject";

@Injectable({
	providedIn: ReportsServicesModule,
})
export class ReportEventEmitterService {
	reportSaved = new EventSubject<void>();
	reportUpdated = new EventSubject<void>();
	reportRemoved = new EventSubject<void>();
}
