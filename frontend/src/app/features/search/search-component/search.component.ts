import {AfterViewInit, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as mapboxgl from 'mapbox-gl';
import {CustomersService} from "../../../core/core-services/customers/customers.service";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

export class SearchComponent implements OnInit, AfterViewInit {

  private map!: mapboxgl.Map;

  customers:any=[];

  constructor(private customersService: CustomersService){

  }

  ngOnInit() {
    this.map = new mapboxgl.Map({
      accessToken: 'pk.eyJ1IjoiYWZhYnJhIiwiYSI6ImNscmYxMWg4azAwYzEybW11eXFtMDlpYzAifQ.7E2Ku-3YQNBgAXuuxU4izw',
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [1.5, 41.5], // starting position [lng, lat]
      zoom: 7 // starting zoom
    });

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data[0];

    })

  }

  ngAfterViewInit() {
    this.map.resize(); // Ajusta el tamaño del mapa después de la inicialización
  }

}
