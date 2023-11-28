import {Component} from "@angular/core";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {commonSettings} from "../../../../../shared/infrastructure/datatables/commonSettings";
import {ReportsApiService} from "../../services/reports-api/reports-api.service";
import {ReportStoreService} from "../../services/report-store/report-store.service";
import FileSaver from "file-saver";

@Component({
  selector: "app-report-viewer",
  templateUrl: "./report-viewer.component.html",
  styleUrls: ["./report-viewer.component.scss"],
})
export class ReportViewerComponent {
  dtOptions: DataTables.Settings = {
    ...commonSettings,
    columns: this.reportStore.observedReport()!.columns.map((column) => {
      return {title: column.name, data: column.name, width: `${column.size}px`};
    }),
    ajax: async (parameters, callback) => {
      const reportId = this.reportStore.observedReportId();
      if (!reportId) {
        throw new Error("Report id not defined");
      }
      callback(
        await this.reportsApi.execute(
          reportId,
          parameters,
          this.reportStore.cachedReportParameters(),
        ),
      );
    },
  };

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private reportsApi: ReportsApiService,
    private reportStore: ReportStoreService,
  ) {
  }

  close() {
    this.ngbActiveModal.close();
  }

  async exportToCSV() {
    const reportId = this.reportStore.observedReportId();
    if (!reportId) {
      throw new Error("Report id not defined");
    }

    const reportName = this.reportStore.observedReport()!.name;
    const columns = this.reportStore.observedReport()!.columns.map((column) => column.name);
    const data = await this.reportsApi.getData(this.reportStore.cachedReportParameters(), reportId);
    const header = columns.join(";");
    const body = data
      .map((entry: any) => {
        return columns.map((col) => entry[col]).join(";");
      })
      .join("\n");
    const csvData = `${header}\n${body}`;

    const blob = new Blob([csvData], {type: "text"});
    FileSaver.saveAs(blob, `${reportName}.csv`);
  }

  async printReport() {
    const parameters = this.reportStore.cachedReportParameters();
    const id = this.reportStore.observedReport()!.id!;

    const renderedContent = await this.reportsApi.render(parameters, id);

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      throw new Error("Error opening window");
    }
    reportWindow.document.write(renderedContent);
    reportWindow.document.close();

    reportWindow.focus();
    setTimeout(() => {
      reportWindow.print();
      reportWindow.close();
    }, 2000);
  }
}
