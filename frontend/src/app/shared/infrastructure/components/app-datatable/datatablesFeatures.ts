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

	async getTable(): Promise<DataTables.Api> {
		return await this.datatableElement.dtInstance;
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

    const currentTableElement = document.getElementById(this.dtInstance.tables().nodes()[0].id + '_filter')

    this.renderer.setStyle(currentTableElement, "width", "100%");
    this.renderer.setStyle(currentTableElement, "height", "31px!important");
    let generalSearchInputParent = this.renderer.parentNode(currentTableElement);

    const tableButtonsElement = document.getElementById(this.dtInstance.tables().nodes()[0].id + '_wrapper')
    let tableButtons = tableButtonsElement!.getElementsByClassName("table-filters").item(0);

    this.buttonDiv = tableButtons as HTMLElement;
    if (!this.buttonDiv) {
      this.buttonDiv = this.renderer.createElement("div");
      this.renderer.setProperty(this.buttonDiv, "id", "datatables-button-header");
      this.renderer.appendChild(generalSearchInputParent, this.buttonDiv);
    }
  }

  async createFilters(filterParams: filterParams[]) {
    //infraestructure creation of filter


    let icon = this.renderer.createElement("i");
    this.renderer.addClass(icon, "fa-solid");
    this.renderer.addClass(icon, "fa-filter");

    let activateFiltersButton = this.renderer.createElement("button");
    this.renderer.addClass(activateFiltersButton, "btn");
    this.renderer.addClass(activateFiltersButton, "btn-primary");
    this.renderer.addClass(activateFiltersButton, "activate-filters-button");
    this.renderer.appendChild(activateFiltersButton, icon);


    let filterDiv = this.renderer.createElement("div");
    this.renderer.addClass(filterDiv, "ms-auto");
    this.renderer.addClass(filterDiv, "col-auto");
    this.renderer.addClass(filterDiv, "order-md-2");
    this.renderer.addClass(filterDiv, "d-none");
    this.renderer.addClass(filterDiv, "d-md-block");
    this.renderer.appendChild(filterDiv, activateFiltersButton);

    this.renderer.appendChild(this.buttonDiv, filterDiv);

    this.renderer.listen(activateFiltersButton, "click", () => {
      if (this.isFilteringActive) {
        this.isFilteringActive = false;
        let thead = document.getElementById("filter-thead");
        console.log(thead)
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
                that.renderer.addClass(input, "form-control");
                that.renderer.addClass(input, "form-control-sm");
                that.renderer.setProperty(
                  input,
                  "placeholder",
                  `Buscar ${this.header().innerText}`,
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

                that.renderer.addClass(inputNumber, "form-control");
                that.renderer.addClass(inputNumber, "form-control-sm");
                that.renderer.setProperty(inputNumber, "type", "number");
                that.renderer.setProperty(
                  inputNumber,
                  "placeholder",
                  `${this.header().innerText}`,
                );
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

                that.renderer.addClass(selector, "form-control");
                that.renderer.addClass(selector, "form-control-sm");
                let option = that.renderer.createElement("option");
                that.renderer.setProperty(option, "value", "");
                let optionText = that.renderer.createText('Seleccionar');
                that.renderer.appendChild(option, optionText);
                that.renderer.appendChild(selector, option);
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
              case 3: // datetime
                let inputDatetime = that.renderer.createElement("input");
                that.renderer.addClass(inputDatetime, "form-control");
                that.renderer.addClass(inputDatetime, "form-control-sm");
                that.renderer.setProperty(inputDatetime, "type", "date");
                that.renderer.setProperty(
                  inputDatetime,
                  "placeholder",
                  `${this.header().innerText}`,
                );
                that.renderer.listen(inputDatetime, "change", () => {
                  let searchValue = inputDatetime.value;
                  that.dtInstance.column(columnNumber).search(searchValue).draw();
                });
                filterType=inputDatetime
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
    addButtonText: string
  ): Element {
    let currentTableElement = document.getElementById(this.dtInstance.tables().nodes()[0].id + '_filter');
    let generalSearchInputParent = renderer.parentNode(currentTableElement);

    const tableButtonsElement = document.getElementById(this.dtInstance.tables().nodes()[0].id + '_wrapper')
    let tableButtons = tableButtonsElement!.getElementsByClassName("table-filters").item(0);

    let buttonDiv = tableButtons as HTMLElement;

    if (buttonDiv == null) {
      buttonDiv = renderer.createElement("div");
      renderer.addClass(buttonDiv, "inline-flex");
      renderer.setProperty(buttonDiv, "id", "datatables-button-header");
      renderer.appendChild(generalSearchInputParent, buttonDiv);
    }

    let addBtnDiv = this.renderer.createElement("div");
    this.renderer.addClass(addBtnDiv, "order-md-5");
    this.renderer.addClass(addBtnDiv, "order-1");
    this.renderer.addClass(addBtnDiv, "col-md-auto");
    this.renderer.addClass(addBtnDiv, "col-12");
    //infraestructure creation of data editor opener
    let editorOpenerButton = renderer.createElement("button");
    renderer.addClass(editorOpenerButton, "btn");
    renderer.addClass(editorOpenerButton, "btn-primary");
    renderer.addClass(editorOpenerButton, "w-100");
    renderer.addClass(editorOpenerButton, "w-md-auto");
    renderer.addClass(editorOpenerButton, "editor-opener-button");


    // let locationText = document.getElementById('location-title')!.textContent

    let buttonText = this.renderer.createText(`Afegir ${addButtonText.toLowerCase()}`);
    renderer.appendChild(editorOpenerButton, buttonText);

    renderer.appendChild(addBtnDiv, editorOpenerButton);
    renderer.appendChild(buttonDiv, addBtnDiv);
    this.renderer.listen(editorOpenerButton, "click", () => {
      editRequest.emit(undefined);
    });
    return editorOpenerButton;
  }

  async createRefreshRowsButton() {
    let refreshDiv = this.renderer.createElement("div");
    this.renderer.addClass(refreshDiv, "order-md-4");
    this.renderer.addClass(refreshDiv, "col-auto");
    this.renderer.addClass(refreshDiv, "d-none");
    this.renderer.addClass(refreshDiv, "d-md-block");
    //infraestructure creation of filter
    let refreshButton = this.renderer.createElement("button");
    let refreshIcon = this.renderer.createElement("i");
    this.renderer.addClass(refreshIcon, "fa-solid");
    this.renderer.addClass(refreshIcon, "fa-refresh");

    this.renderer.appendChild(refreshButton, refreshIcon);
    this.renderer.addClass(refreshButton, "btn");
    this.renderer.addClass(refreshButton, "btn-primary");
    this.renderer.addClass(refreshButton, "activate-filters-button");
    this.renderer.appendChild(refreshDiv, refreshButton);
    this.renderer.appendChild(this.buttonDiv, refreshDiv);
    let that = this;
    this.renderer.listen(refreshButton, "click", () => {
      /*this.dtInstance.columns().every(function (columnNumber: number) {
        that.renderer.addClass(refreshIcon, "fa-spin");
        that.dtInstance.column(0).search("").draw();
        setTimeout(() => {
          console.log("aaaaa")
          that.updateRefreshButton(refreshIcon);
        }, 1000);
      });*/

      that.renderer.addClass(refreshIcon, "fa-spin");
      that.dtInstance.column(0).search("").draw();
      setTimeout(() => {
        that.updateRefreshButton(refreshIcon);
      }, 1000);

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

