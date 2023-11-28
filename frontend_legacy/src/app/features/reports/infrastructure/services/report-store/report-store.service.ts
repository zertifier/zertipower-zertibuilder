import { Injectable, signal } from "@angular/core";
import { ReportsServicesModule } from "../reports-services.module";
import { Report } from "../../../domain/report";

@Injectable({
	providedIn: ReportsServicesModule,
})
export class ReportStoreService {
	editingReportId = signal<number | undefined>(undefined);
	observedReportId = signal<number | undefined>(undefined);
	observedReport = signal<Report | undefined>(undefined);
	cachedReportParameters = signal<any>(undefined);
}
