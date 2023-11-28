import { ElementRef, EventEmitter, Renderer2 } from "@angular/core";
import { DataTableDirective } from "angular-datatables";
import { filterParams } from "./interfaces/filterParams.interface";

interface HTMLCollectionOf<T extends Element> extends HTMLCollection {
	item(index: number): T;

	namedItem(name: string): T;

	[index: number]: T;
}

export class DatatablesFeatures {
	renderer!: Renderer2;
	datatableElement!: DataTableDirective;
	elementRef!: ElementRef;
	dtInstance!: DataTables.Api;
	document!: Document;
	buttonDiv!: HTMLElement | null;
	isFilteringActive = false;

	constructor(
		document: Document,
		renderer: Renderer2,
		datatableElement: DataTableDirective,
		elementRef: ElementRef,
	) {
		this.document = document;
		this.renderer = renderer;
		this.datatableElement = datatableElement;
		this.elementRef = elementRef;
	}

	/** modifies the datatables data response following filterParams default translations criteria
	 *  to set more understandable columns data
	 * @param filterParams
	 * @param dataResponse
	 */
	static modifyDefaultValues(filterParams: filterParams[], dataResponse: any) {
		filterParams.forEach((filterparam) => {
			dataResponse.forEach((data: any) => {
				//change 0/1 to default translations to see the values at the registers
				if (filterparam.binarySelector) {
					if (data[filterparam.title] == 1) {
						data[filterparam.title] = filterparam.defaultTranslation![0];
					} else if (data[filterparam.title] == 0) {
						data[filterparam.title] = filterparam.defaultTranslation![1];
					}
				}
			});
		});

		dataResponse.forEach((data: any) => {
			//transform null data into void string
			Object.keys(data).forEach((key) => {
				if (data[key] === null) {
					//delete data[key];
					data[key] = "";
				}
			});
		});
	}

	async initialize() {
		this.dtInstance = await this.datatableElement.dtInstance;
		// filtering button creation:
		let generalSearchInput = document.getElementsByClassName("dataTables_filter").item(0);
		let input = generalSearchInput!.getElementsByTagName("input").item(0);
		input!.setAttribute(
			"style",
			"height:30px; min-height:30px; max-height:30px; padding:0px!important; margin:0px 0px 0px 10px!important",
		);
		this.renderer.setStyle(generalSearchInput, "transform", "translate(-13px, 0px)");
		this.renderer.setStyle(generalSearchInput, "height", "30px!important");
		let generalSearchInputParent = this.renderer.parentNode(generalSearchInput);
		this.renderer.setStyle(generalSearchInputParent, "display", "flex");
		this.renderer.setStyle(generalSearchInputParent, "justify-content", "end");

		//button div
		this.buttonDiv = document.getElementById("datatables-button-header");
		if (this.buttonDiv == null) {
			this.buttonDiv = this.renderer.createElement("div");
			this.renderer.addClass(this.buttonDiv, "d-flex");
			this.renderer.setProperty(this.buttonDiv, "id", "datatables-button-header");
			this.renderer.appendChild(generalSearchInputParent, this.buttonDiv);
		}
	}

	async createFilters(filterParams: filterParams[]) {
		//infraestructure creation of filter
		let activateFiltersButton = this.renderer.createElement("button");
		//let filterText= this.renderer.createText("Column filtering")
		this.renderer.addClass(activateFiltersButton, "ms-2");
		this.renderer.addClass(activateFiltersButton, "datatables-button");
		let icon = this.renderer.createElement("i");
		this.renderer.addClass(icon, "fa-solid");
		this.renderer.addClass(icon, "fa-filter");
		this.renderer.appendChild(activateFiltersButton, icon);
		//this.renderer.appendChild(activateFiltersButton,filterText);
		this.renderer.addClass(activateFiltersButton, "btn");
		this.renderer.addClass(activateFiltersButton, "btn-outline-primary");
		this.renderer.addClass(activateFiltersButton, "activate-filters-button");
		this.renderer.appendChild(this.buttonDiv, activateFiltersButton);
		this.renderer.listen(activateFiltersButton, "click", () => {
			if (this.isFilteringActive) {
				this.isFilteringActive = false;
				let thead = document.getElementById("filter-thead");
				thead!.remove();
			} else {
				//filtering inputs creation:
				this.isFilteringActive = true;
				//creating new thead to store the inputs
				let thead = this.renderer.createElement("thead");
				this.renderer.addClass(thead, "filter-thead");
				this.renderer.setProperty(thead, "id", "filter-thead");
				let datatablesHead = this.elementRef.nativeElement.querySelector("thead");
				let tr = this.renderer.createElement("tr");
				let datatablesHeadParent = this.renderer.parentNode(datatablesHead);
				let that = this;
				this.dtInstance.columns().every(function (columnNumber: number) {
					let filterType;
					if (filterParams[columnNumber]) {
						switch (filterParams[columnNumber].type) {
							case 0: // text input
								let input = that.renderer.createElement("input");
								that.renderer.addClass(input, "filter-input");
								that.renderer.setProperty(
									input,
									"placeholder",
									`Search ${this.header().innerText}`,
								);
								that.renderer.listen(input, "keyup", () => {
									let searchValue = input.value;
									that.dtInstance.column(columnNumber).search(searchValue).draw();
								});
								filterType = input;
								break;
							case 1: // number input
								let inputNumber = that.renderer.createElement("input");
								that.renderer.addClass(inputNumber, "filter-input");
								that.renderer.setProperty(inputNumber, "type", "number");
								that.renderer.listen(inputNumber, "keyup", () => {
									let searchValue = inputNumber.value;
									that.dtInstance.column(columnNumber).search(searchValue).draw();
								});
								that.renderer.listen(inputNumber, "change", (e) => {
									that.dtInstance.column(columnNumber).search(e.target.value).draw();
								});
								filterType = inputNumber;
								break;
							case 2: //selector
								let selector = that.renderer.createElement("select");
								that.renderer.addClass(selector, "filter-selector");
								filterParams[columnNumber].options.forEach((filterOption: any) => {
									let option = that.renderer.createElement("option");
									that.renderer.setProperty(option, "id", filterOption.value);
									that.renderer.setProperty(option, "value", filterOption.value);
									let optionText = that.renderer.createText(filterOption.name);
									that.renderer.appendChild(option, optionText);
									that.renderer.appendChild(selector, option);
								});
								that.renderer.listen(selector, "change", (e) => {
									that.dtInstance.column(columnNumber).search(e.target.value).draw();
								});
								filterType = selector;
								break;
							default:
								break;
						}
					}
					let th = that.renderer.createElement("th");
					if (filterType) {
						that.renderer.appendChild(th, filterType);
					}
					that.renderer.appendChild(tr, th);
				});
				this.renderer.appendChild(thead, tr);
				this.renderer.insertBefore(datatablesHeadParent, thead, datatablesHead);
			}
		});
	}

	createAddRowButton(
		document: Document,
		renderer: Renderer2,
		editRequest: EventEmitter<number>,
	): Element {
		let generalSearchInput = document.getElementsByClassName("dataTables_filter").item(0);
		let generalSearchInputParent = renderer.parentNode(generalSearchInput);
		//button div
		let buttonDiv = document.getElementById("datatables-button-header");
		if (buttonDiv == null) {
			buttonDiv = renderer.createElement("div");
			renderer.addClass(buttonDiv, "inline-flex");
			renderer.setProperty(buttonDiv, "id", "datatables-button-header");
			renderer.appendChild(generalSearchInputParent, buttonDiv);
		}
		//infraestructure creation of data editor opener
		let editorOpenerButton = renderer.createElement("button");
		renderer.addClass(editorOpenerButton, "datatables-button");
		renderer.addClass(editorOpenerButton, "ms-2");
		let editorOpenerIcon = renderer.createElement("i");
		renderer.addClass(editorOpenerIcon, "fa-solid");
		renderer.addClass(editorOpenerIcon, "fa-plus");
		renderer.appendChild(editorOpenerButton, editorOpenerIcon);
		renderer.addClass(editorOpenerButton, "btn");
		renderer.addClass(editorOpenerButton, "btn-outline-primary");
		renderer.addClass(editorOpenerButton, "editor-opener-button");
		renderer.appendChild(buttonDiv, editorOpenerButton);
		this.renderer.listen(editorOpenerButton, "click", () => {
			editRequest.emit(undefined);
		});
		return editorOpenerButton;
	}

	async createRefreshRowsButton() {
		//infraestructure creation of filter
		let refreshButton = this.renderer.createElement("button");
		//let filterText= this.renderer.createText("Column filtering")
		this.renderer.addClass(refreshButton, "ms-2");
		this.renderer.addClass(refreshButton, "datatables-button");
		let refreshIcon = this.renderer.createElement("i");
		this.renderer.addClass(refreshIcon, "fa-solid");
		this.renderer.addClass(refreshIcon, "fa-refresh");

		this.renderer.appendChild(refreshButton, refreshIcon);
		//this.renderer.appendChild(activateFiltersButton,filterText);
		this.renderer.addClass(refreshButton, "btn");
		this.renderer.addClass(refreshButton, "btn-outline-primary");
		this.renderer.addClass(refreshButton, "activate-filters-button");
		this.renderer.appendChild(this.buttonDiv, refreshButton);
		let that = this;
		this.renderer.listen(refreshButton, "click", () => {
			this.dtInstance.columns().every(function (columnNumber: number) {
				that.renderer.addClass(refreshIcon, "fa-spin");
				that.dtInstance.column(0).search("").draw();
				setTimeout(() => {
					that.updateRefreshButton(refreshIcon);
				}, 1000);
			});
		});
	}

	updateRefreshButton(refreshIcon: any) {
		this.renderer.removeClass(refreshIcon, "fa-spin");
	}

	showOrHideButtons(show: boolean) {
		let columnButtons = this.document.getElementsByClassName("btn-column");
		if (show) {
			for (let i = 0; i < columnButtons.length; i++) {
				columnButtons.item(i)!.classList.remove("d-none");
			}
		} else {
			for (let i = 0; i < columnButtons.length; i++) {
				columnButtons.item(i)!.classList.add("d-none");
			}
		}
	}
}
