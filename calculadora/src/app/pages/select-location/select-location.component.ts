import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';


@Component({
  selector: 'app-select-location',
  templateUrl: './select-location.component.html'
})

export class SelectLocationComponent {

    locations:any = [];
    selectedLocation:any;

    constructor(private locationService:LocationService,private router:Router){
        this.locationService.getLocations().subscribe(async (res:any)=>{
            this.locations= res.data;
        },(error:any)=>{
            console.log("error getting locations: ", error)
        })
    }

    selectLocation(selectedLocation:any){
        console.log(selectedLocation)
        // this.router.navigate(
        //     ['/search/', selectedLocation.id] 
        // ); 
        localStorage.setItem("location",selectedLocation.id)
        this.router.navigate(
            ['/calculate'] 
        );

    }

}