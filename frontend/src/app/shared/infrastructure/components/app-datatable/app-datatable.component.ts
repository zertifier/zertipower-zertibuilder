import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
	Renderer2,
	SimpleChanges,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";
import { DataTableDirective } from "angular-datatables";
import { HttpClient } from "@angular/common/http";
import { DatatablesFeatures } from "./datatablesFeatures";
import { filterParams } from "./interfaces/filterParams.interface";
import { dtColumns } from "./interfaces/dtColumns.interface";
import { dataTablesResponse } from "./interfaces/datatablesResponse.interface";

@Component({
	selector: "app-datatable",
	templateUrl: "./app-datatable.component.html",
	styleUrls: ["./app-datatable.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class AppDatatableComponent implements OnInit {
	//inputs:
	@Input() title = "";
	@Input() filterParams!: filterParams[];
	@Input() columns!: dtColumns[];
	@Input() columnDefs: any[] = [];
	@Input() url = "";
	@Input() addRows = false;
	@Input() editRows = false;
	@Input() filterColumns = false;
	@Input() refreshRows = false;
	//outputs:
	@Output() editRequest = new EventEmitter<number>();
	@Output() deleteRequest = new EventEmitter<number>();

	//datatables config:
	@ViewChild(DataTableDirective, { static: false })
	datatableElement!: DataTableDirective;
	dtOptions: DataTables.Settings = {};

	editorOpenerButton!: Element;

	dataResponse: any;
	isModalOpened = false;
	selectedId!: any;
	documentListener: any;
	showButtons = false;

	datatablesFeatures!: DatatablesFeatures;

	constructor(
		private http: HttpClient,
		private renderer: Renderer2,
		private elementRef: ElementRef,
	) {}

	ngOnInit(): void {
		this.dtOptions = {
			serverSide: true,
			destroy: true,
			ajax: (dataTablesParameters: any, callback: any) => {
        		//console.log(dataTablesParameters)
				//dataTablesParameters.length = this.rowLength;

				const filteredColumns = dataTablesParameters.columns.filter(
					(column: any) => column.data !== null
				);
				dataTablesParameters.columns = filteredColumns;

				this.http
					.post<dataTablesResponse>(this.url, dataTablesParameters, {})
					.subscribe((resp: any) => {
						this.dataResponse = resp.data.data;
						DatatablesFeatures.modifyDefaultValues(this.filterParams, this.dataResponse);
						callback({
							recordsTotal: resp.data.recordsTotal,
							recordsFiltered: resp.data.recordsFiltered,
							data: resp.data.data,
						});
						this.datatablesFeatures.showOrHideButtons(this.editRows);
					});
			},
			columns: this.columns,
			columnDefs: this.columnDefs,
			scrollX: true,
			order:[[0,'desc']],
      dom: '<<"row mb-3 table-filters g-3"<"col-12 col-md-6 order-2 order-md-1"f>>><"table-responsive"t><"row mt-3"<"col-md-12"p>>',
      language: {
        emptyTable: "No hi ha dades",
        info: "",
        infoEmpty: "Sense entrades",
        infoFiltered: "(Filtrado de _MAX_ entries)",
        lengthMenu: "Mostrar _MENU_",
        loadingRecords: "Cargant informació...",
        processing: "Processant...",
        search: '<i class="fa fa-search" aria-hidden="true"></i>',
        zeroRecords: "No hi ha  registres",
        paginate: {
          first: "Primera",
          last: "Última",
          next: "Següent",
          previous: "Anterior",
        },
        aria: {
          sortAscending: ": activar para ordenar la columna ascendiente",
          sortDescending: ": activar para ordenar la columna descendiente",
        },
      },
		};
	}

	ngOnChanges(changes: SimpleChanges) {
		for (const propName in changes) {
			if (changes.hasOwnProperty(propName)) {
				switch (propName) {
					case "editRows":
						if (changes["editRows"].currentValue != this.showButtons) {
							if (this.datatablesFeatures) {
								this.datatablesFeatures.showOrHideButtons(this.editRows);
							}
						}
						if (changes["refreshRows"].currentValue != this.showButtons) {
							if (this.datatablesFeatures) {
								this.datatablesFeatures.showOrHideButtons(this.editRows);
							}
						}
						break;
					default:
						break;
				}
			}
		}
	}

	ngOnDestroy(): void {
		if (!this.documentListener) {
			this.documentListener.destroy;
		}
	}

	async ngAfterViewInit() {

		this.datatablesFeatures = new DatatablesFeatures(
			document,
			this.renderer,
			this.datatableElement,
			this.elementRef,
		);
		await this.datatablesFeatures.initialize();

		if (this.filterColumns) {
			this.datatablesFeatures.createFilters(this.filterParams);
		}
		if (this.refreshRows) {
			this.datatablesFeatures.createRefreshRowsButton();
		}

		if (this.addRows) {
			this.editorOpenerButton = this.datatablesFeatures.createAddRowButton(
				document,
				this.renderer,
				this.editRequest,
        ''
			);
		}

		this.datatablesFeatures.showOrHideButtons(this.editRows);

		let datatablesBody = document.getElementsByClassName("dataTables_scrollBody").item(0);

		//obtenim el filtre clicat:
		this.documentListener = this.renderer.listen(datatablesBody, "click", (event) => {
			let target = event.target;
			if (this.editorOpenerButton) {
				this.datatablesFeatures.showOrHideButtons(this.editRows);
			}

			if (target.hasAttribute("data-id")) {
				let id = target.getAttribute("data-id");
				this.selectedId = id;
				let classes = target.getAttribute("class");
				if (classes) {
					if (classes.includes("editRow")) {
						this.editRequest.emit(this.selectedId);
					} else if (classes.includes("deleteRow")) {
						this.deleteRequest.emit(this.selectedId);
					}
				}
			}

			// this.updateTable();
		});

		// this.updateTable();
	}

	updateTable() {
		if (this.datatableElement) {
			this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
				dtInstance.column(0).search("").draw();
			});
		}
	}
}
