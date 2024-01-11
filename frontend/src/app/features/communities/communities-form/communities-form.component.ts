import {ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {BehaviorSubject, Observable, repeat, Subject} from 'rxjs';
import {CommunitiesApiService} from '../communities.service';
import moment from 'moment';
import {CustomersService} from "../../../core/core-services/customers/customers.service";
import {EnergyService} from "../../../core/core-services/energy/energy.service";
import Chart from "chart.js/auto";

@Component({
    selector: 'communities-form',
    templateUrl: './communities-form.component.html',
    styleUrls: ['./communities-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CommunitiesFormComponent implements OnInit {

    //todo: si seleccionamos un cups para simular generacion y luego borramos
    // community cups no se actualiza el chart
    //todo: no se tiene en cuenta en la actualizacion la simulación.
    //todo: si se ha seleccionado para la simulacion un cups y luego se quita de la comunidad, qué pasa? (FIXED)
    //todo: a veces no cargan los cups de la comunidad aunque si cargan los cups. (FIXED)
    //todo: simular diversas generaciones a la vez: un valor input diferente por community cups

    @ViewChild('yearChart') yearChart: any;

    tinymceConfig = {
        language: 'es',
        language_url: '/assets/tinymce/langs/es.js',
        plugins: 'lists link image table code help wordcount',
        toolbar:
            'blocks bold italic forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | ' +
            'image table | ' +
            'removeformat help',
        base_url: '/assets/tinymce',
        suffix: '.min',
        height: 200,
        statusbar: false,
        menubar: false,
        promotion: false,
    }

    customers: any;
    test: number = 1;
    id: number = 0;
    communityCups: any[] = [];
    selectedTab: string = 'monthly';

    selectedCups: any;

    sumYearImport: number = 0;
    sumYearGeneration: number = 0;
    sumYearConsumption: number = 0;
    sumYearExport: number = 0;

    sumMonthImport: number[] = [];
    sumMonthGeneration: number[] = [];
    sumMonthConsumption: number[] = [];
    sumMonthExport: number[] = [];

    sumDayImport: number[] = [];
    sumDayGeneration: number[] = [];
    sumDayConsumption: number[] = [];
    sumDayExport: number[] = [];

    multiplyGenerationResult: number = 0;

    communityId: number | any;

    form = this.formBuilder.group({
        id: new FormControl<number | null>(null),
        name: new FormControl<string | null>(null),
        test: new FormControl<number | null>(null),
        createdAt: new FormControl<string | null>(null),
        updatedAt: new FormControl<string | null>(null),
    });

    yearChartType: string = 'pie';
    yearChartLabels: string[] = [];
    yearChartDatasets: any[] | undefined = [];
    yearChartData: number[] = [];
    yearChartBackgroundColor: string [] = [];
    updateYearChart: boolean = false;
    updateYearChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    monthChartType: string = 'bar';
    monthChartLabels: string[] = [];
    monthChartDatasets: any[] | undefined = undefined;
    monthChartData: any[] = [];
    monthChartBackgroundColor: string [] = [];
    updateMonthChart: boolean = false;
    updateMonthChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    dayChartType: string = 'bar';
    dayChartLabels: string[] = [];
    dayChartDatasets: any[] | undefined = undefined;
    dayChartData: any[] = [];
    dayChartBackgroundColor: string [] = [];
    updateDayChart: boolean = false;
    updateDayChartSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    unformattedDate = new Date;

    selectedDate: any = "2023-05-05";
    selectedMonth:any;
    selectedYear = 2023; //new Date().getFullYear()

    constructor(
        private formBuilder: FormBuilder,
        private apiService: CommunitiesApiService,
        private activeModal: NgbActiveModal,
        private customersService: CustomersService,
        private energyService: EnergyService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.getInfo()
    }

    setEditingId(id: number) {
        this.id = id;
        if (!this.id) {
            return;
        }
        this.apiService.getById(id).subscribe((data) => {
            console.log(data)
            this.form.controls.id.setValue(data.id);
            this.communityId = data.id;
            this.form.controls.name.setValue(data.name);
            this.form.controls.test.setValue(data.test);
            this.test = data.test;
            this.form.controls.createdAt.setValue(moment.utc(data.createdAt).format('YYYY-MM-DDTHH:mm'));
            this.form.controls.updatedAt.setValue(moment.utc(data.updatedAt).format('YYYY-MM-DDTHH:mm'));
        });
    }

    getInfo() {
        this.customersService.getCustomersCups().subscribe(async (res: any) => {

            this.customers = res.data[0];

            //get the cups that own to the selected community
            this.communityCups = this.customers.filter((cups: any) =>
                cups.community_id == this.id
            )

            //get the cups that doesnt own to other communities
            this.customers = this.customers.filter((cups: any) =>
                cups.community_id == this.id || cups.community_id == null || cups.community_id == 0
            )

            this.updateData();

            // notify changes to ng-select
            this.cdr.detectChanges();
        })
    }

    async multiplyGeneration(event: any) {

        let factor = event.target.value;
        this.selectedCups.yearEnergy.factor = factor;
        this.multiplyGenerationResult = this.selectedCups.yearEnergy.sumGeneration * factor;

        this.sumYearImport = 0;
        this.sumYearConsumption = 0;
        this.sumYearGeneration = 0;
        this.sumYearExport = 0;

        const getAllEnergy = this.communityCups.map(async (cups: any) => {
            //todo: update export;
            this.sumYearImport += cups.yearEnergy.sumImport | 0;
            if (cups.id == this.selectedCups.id) {
                cups.yearEnergy.factor = factor;
                this.sumYearGeneration += this.multiplyGenerationResult;
            } else {
                this.sumYearGeneration += cups.yearEnergy.sumGeneration | 0;
            }
            this.sumYearConsumption += cups.yearEnergy.sumConsumption | 0;
            this.sumYearExport += cups.yearEnergy.sumExport | 0;
        })
        await Promise.all(getAllEnergy)
        console.log(this.sumYearImport, this.sumYearConsumption, this.sumYearGeneration, this.sumYearExport)
        this.updateYearChartValues()
    }

    changeSelectedCups(selectedCups: any) {
        console.log("ep: ", selectedCups)
        console.log("change cups to: ", this.selectedCups)
    }

    changeDay() {
        this.getDayEnergy();
    }

    changeMonth() {
        this.getYearEnergy();
    }

    changeYear() {
        this.getYearEnergy();
    }

    changeCommunityCups(communityCups: any) {
        console.log("change community cups : ", communityCups, this.communityCups)
        console.log("selected cups", this.selectedCups)
        let cupsFound = this.communityCups.find((cups) => cups.id == this.selectedCups.id)
        console.log("cups found:", cupsFound)
        if (!cupsFound) {
            this.selectedCups = undefined;
        }
        this.updateData();
    }

    updateData() {
        switch (this.selectedTab) {
            case 'yearly':
                this.getYearEnergy();
                break;
            case 'monthly':
                this.getMonthEnergy();
                break;
            case 'daily':
                this.getDayEnergy();
                break;
            default:
                console.log("Update data case default selected tab: ", this.selectedTab)
        }
    }

    async getYearEnergy() {
        this.sumYearImport = 0;
        this.sumYearConsumption = 0;
        this.sumYearGeneration = 0;
        this.sumYearExport = 0;

        const getAllEnergy = this.communityCups.map(async (cups: any) => {
            //get energy by cups
            let yearEnergy: any = await this.getYearEnergyByCups(cups.id, this.selectedYear);
            cups.yearEnergy = yearEnergy;
            cups.yearEnergy.factor = 0;

            //create sum of year energy cups:
            this.sumYearImport += yearEnergy.sumImport | 0;
            this.sumYearGeneration += yearEnergy.sumGeneration | 0;
            this.sumYearConsumption += yearEnergy.sumConsumption | yearEnergy.sumImport;
            this.sumYearExport += yearEnergy.sumExport | 0;
        })

        await Promise.all(getAllEnergy)

        this.updateYearChartValues();
        this.updateMonthChartValues();
    }

    async getMonthEnergy() {

        console.log(this.selectedMonth)

        this.sumMonthImport = Array.apply(null, Array(12)).map(function () {
            return 0
        });
        this.sumMonthGeneration = Array.apply(null, Array(12)).map(function () {
            return 0
        });
        this.sumMonthConsumption = Array.apply(null, Array(12)).map(function () {
            return 0;
        });
        this.sumMonthExport = Array.apply(null, Array(12)).map(function () {
            return 0;
        });

        const getAllEnergy = this.communityCups.map(async (cups: any) => {
            //get energy by cups
            let yearEnergy: any = await this.getYearEnergyByCups(cups.id, this.selectedYear);
            cups.yearEnergy = yearEnergy;
            cups.yearEnergy.factor = 0;

            //create sum of month energy cups:
            this.sumMonthImport = this.sumMonthImport.map((monthImport, index) => {
                monthImport += yearEnergy.kwhImport[index] | 0;
                return monthImport;
            })
            this.sumMonthExport = this.sumMonthExport.map((monthExport, index) => {
                monthExport += yearEnergy.kwhExport[index] | 0;
                return monthExport;
            })
            this.sumMonthGeneration = this.sumMonthGeneration.map((monthGeneration, index) => {
                monthGeneration += yearEnergy.kwhGeneration[index] | 0;
                return monthGeneration;
            })
            this.sumMonthConsumption = this.sumMonthConsumption.map((monthConsumption, index) => {
                monthConsumption += yearEnergy.kwhConsumption[index] | yearEnergy.kwhImport[index] | 0;
                return monthConsumption;
            })
        })

        await Promise.all(getAllEnergy)

        this.updateMonthChartValues();
    }

    async getDayEnergy() {

        this.sumDayImport = Array.apply(null, Array(24)).map(function () {
            return 0
        });
        this.sumDayGeneration = Array.apply(null, Array(24)).map(function () {
            return 0
        });
        this.sumDayConsumption = Array.apply(null, Array(24)).map(function () {
            return 0;
        });
        this.sumDayExport = Array.apply(null, Array(24)).map(function () {
            return 0;
        });

        const getAllEnergy = this.communityCups.map(async (cups: any) => {
            //get energy by cups
            let dayEnergy = await this.getDayEnergyByCups(cups.id, this.selectedDate);
            cups.dayEnergy = dayEnergy;

            this.sumDayImport = this.sumDayImport.map((dayImport, index) => {
                dayImport += dayEnergy.kwhImport[index] | 0;
                return dayImport;
            })
            this.sumDayExport = this.sumDayExport.map((dayExport, index) => {
                dayExport += dayEnergy.kwhExport[index] | 0;
                return dayExport;
            })
            this.sumDayGeneration = this.sumDayGeneration.map((dayGeneration, index) => {
                dayGeneration += dayEnergy.kwhGeneration[index] | 0;
                return dayGeneration;
            })
            this.sumDayConsumption = this.sumDayConsumption.map((dayConsumption, index) => {
                dayConsumption += dayEnergy.kwhConsumption[index] | dayEnergy.kwhImport[index] | 0;
                return dayConsumption;
            })
        })

        await Promise.all(getAllEnergy)

        this.updateDayChartValues();

    }

    save() {
        if (this.form.invalid) {
            Swal.fire({
                icon: 'error',
                title: 'Form not valid'
            });
            return;
        }
        const values = this.getValues();
        let request: Observable<any>;
        if (!this.id) {
            request = this.apiService.save(values);
        } else {
            request = this.apiService.update(this.id, values);
        }
        request.subscribe(() => {
            Swal.fire({
                icon: 'success',
                title: 'Success!'
            });
            this.activeModal.close();
        });
    }

    cancel() {
        this.activeModal.dismiss();
    }

    getValues(): any {
        const values: any = {};
        values.id = this.form.value.id;
        values.name = this.form.value.name;
        values.test = this.form.value.test;
        values.createdAt = this.form.value.createdAt;
        values.updatedAt = this.form.value.updatedAt;
        return values;
    }

    getYearEnergyByCups(cups: number, year: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.energyService.getYearByCups(year, cups!).subscribe((res: any) => {
                let monthlyCupsData = res.data;

                let months: string[] = monthlyCupsData.map((entry: any) => entry.month);
                let kwhImport: number[] = monthlyCupsData.map((entry: any) => entry.import);
                let kwhGeneration: number[] = monthlyCupsData.map((entry: any) => entry.generation);
                let kwhExport: number[] = monthlyCupsData.map((entry: any) => entry.export);
                let kwhConsumption: number[] = monthlyCupsData.map((entry: any) => entry.consumption);

                let sumImport = kwhImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
                const sumGeneration = kwhGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
                let sumConsumption = kwhConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
                const sumExport = kwhExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
                //TODO: revisar
                if (sumConsumption < sumImport) {
                    sumConsumption = sumImport
                }
                //const sumExport = sumGeneration-sumConsumption

                console.log("cups: ", cups, "year energy ", sumImport, sumExport, sumConsumption, sumGeneration)
                let yearEnergy = {
                    months,
                    kwhImport,
                    kwhGeneration,
                    kwhConsumption,
                    kwhExport,
                    sumImport,
                    sumGeneration,
                    sumConsumption,
                    sumExport
                }
                resolve(yearEnergy)
            })
        })
    }

    updateMonthChartValues() {
        this.monthChartLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']// [`Import (Kwh)`, `Generation (Kwh)`, `Consumption (Kwh)`, `Surplus (Kwh)`]
        this.monthChartData = [this.sumMonthImport, this.sumMonthGeneration, this.sumMonthConsumption, this.sumMonthExport]
        this.monthChartBackgroundColor = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgba(240, 190, 48, 1)',
            'rgba(33, 217, 92, 0.71)'
        ]
        this.monthChartDatasets = [
            {
                label: `Import (Kwh)`,
                data: this.monthChartData[0],
                backgroundColor: this.monthChartBackgroundColor[0]
            },
            {
                label: 'Generation (Kwh)',
                data: this.monthChartData[1],
                backgroundColor: this.monthChartBackgroundColor[1]
            },
            {
                label: 'Consumption (Kwh)',
                data: this.monthChartData[2],
                backgroundColor: this.monthChartBackgroundColor[2]
            },
            {
                label: 'Export (Kwh)',
                data: this.monthChartData[3],
                backgroundColor: this.monthChartBackgroundColor[3]
            }
        ]

        this.updateMonthChartSubject.next(true);
    }

    updateYearChartValues() {
        this.yearChartDatasets = undefined;
        this.yearChartLabels = [`Import: ${this.sumYearImport} Kwh`, `Generation: ${this.sumYearGeneration} Kwh`, `Consumption: ${this.sumYearConsumption} Kwh`, `Surplus: ${this.sumYearExport} Kwh`]
        this.yearChartData = [this.sumYearImport, this.sumYearGeneration, this.sumYearConsumption, this.sumYearExport]
        this.yearChartBackgroundColor = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgba(240, 190, 48, 1)',
            'rgba(33, 217, 92, 0.71)'
        ]
        this.updateYearChartSubject.next(true)
    }

    updateDayChartValues() {

      let totalImport = this.sumDayImport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
      let totalExport = this.sumDayExport.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
      let totalConsumption = this.sumDayConsumption.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);
      let totalGeneration = this.sumDayGeneration.reduce((partialSum: number, a: number) => partialSum + (a | 0), 0);

        this.dayChartLabels = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']; // [`Import (Kwh)`, `Generation (Kwh)`, `Consumption (Kwh)`, `Surplus (Kwh)`]
        this.dayChartData = [this.sumDayImport, this.sumDayGeneration, this.sumDayConsumption, this.sumDayExport]
        console.log("day chart data: ",this.dayChartData)
        this.dayChartBackgroundColor = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgba(240, 190, 48, 1)',
            'rgba(33, 217, 92, 0.71)'
        ]
        this.dayChartDatasets = [
            {
                label: `Import: ${totalImport} Kwh`,
                data: this.dayChartData[0],
                backgroundColor: this.dayChartBackgroundColor[0]
            },
            {
                label: `Generation: ${totalGeneration} Kwh`,
                data: this.dayChartData[1],
                backgroundColor: this.dayChartBackgroundColor[1]
            },
            {
                label: `Consumption: ${totalConsumption} Kwh`,
                data: this.dayChartData[2],
                backgroundColor: this.dayChartBackgroundColor[2]
            },
            {
                label: `Export ${totalExport} Kwh`,
                data: this.dayChartData[3],
                backgroundColor: this.dayChartBackgroundColor[3]
            }
        ]

        this.updateDayChartSubject.next(true);
    }

    getDayEnergyByCups(cups: number, date: string): Promise<any> {
        console.log('selected date', this.selectedDate)
        return new Promise((resolve, reject) => {
                this.energyService.getHoursByCups(cups, this.selectedDate).subscribe((res: any) => {

                    let hourlyData = res.data
                    const getHour = (datetimeString: any) => {
                        return parseInt(datetimeString.slice(11, 13));
                    };

                    // Ordenar hourlyData por la hora
                    hourlyData = hourlyData.sort((a: any, b: any) => getHour(a.info_datetime) - getHour(b.info_datetime));

                    let hours = hourlyData.map((entry: any) => moment.utc(entry.info_datetime).format('HH'));
                    let kwhImport = hourlyData.map((entry: any) => entry.import);
                    let kwhGeneration = hourlyData.map((entry: any) => entry.generation);
                    let kwhConsumption = hourlyData.map((entry: any) => entry.consumption);
                    let kwhExport = hourlyData.map((entry: any) => entry.export);

                    let dayEnergy = {hours, kwhImport, kwhGeneration, kwhConsumption, kwhExport}
                    console.log("day energy", dayEnergy)
                    resolve(dayEnergy)
                })
            }
        )
    }

}
