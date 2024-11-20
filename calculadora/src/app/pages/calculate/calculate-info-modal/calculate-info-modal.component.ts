import {Component, inject} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {NgClass, NgIf, NgTemplateOutlet} from "@angular/common";

export interface Table {
  title: string,
  headers: string[],
  data: TableData[]
}

export interface TableData {
  title: string,
  value: string
}
@Component({
  selector: 'app-calculate-info-modal',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NgClass
  ],
  templateUrl: './calculate-info-modal.component.html',
  styleUrl: './calculate-info-modal.component.scss'
})
export class CalculateInfoModalComponent {
  activeModal = inject(NgbActiveModal);

  constants: TableData[] = [
    {
      title: "Ingenieria",
      value: "1623 €"
    },
    {
      title: "Estudi i certificacions",
      value: "800 €"
    },
    {
      title: "Declaració responsable",
      value: "33 €"
    },
    {
      title: "Visat projectecte",
      value: "50 €"
    },
    {
      title: "Estudi de seguretat i salut",
      value: "240 €"
    },
    {
      title: "Cooridinació seguritat i salut",
      value: "500 €"
    },
  ]
  installations: TableData[] = [
    {
      title: "<7",
      value: "0.35"
    },
    {
      title: "7-14",
      value: "0.3"
    },
    {
      title: "15-54",
      value: "0.24"
    },
    {
      title: "55-179",
      value: "0.21"
    },
    {
      title: "180-∞",
      value: "0.18"
    },
  ]
  inverters: TableData[] = [
    {
      title: "<7",
      value: "0.105"
    },
    {
      title: "7-14",
      value: "0.087"
    },
    {
      title: "15-54",
      value: "0.072"
    },
    {
      title: "55-179",
      value: "0.063"
    },
    {
      title: "180-∞",
      value: "0.042"
    },

  ]
  panels: TableData[] = [
    {
      title: "Totes",
      value: "0.265"
    },
  ]
  authorizations: TableData[] = [
    {
      title: "0-100",
      value: "kWp * 1.1958 + 255.72"
    },
    {
      title: "100",
      value: "kWp * 1.4218 + 229.35"
    },
  ]
  structures: TableData[] = [
    {
      title: "Xapes coplanar",
      value: "0.035"
    },
    {
      title: "Sandwich",
      value: "0.035"
    },
    {
      title: "Teula coplanar",
      value: "0.007"
    },
    {
      title: "Dech triangular",
      value: "0.1"
    },
    {
      title: "Formigó triangular",
      value: "0.08"
    },
  ]
  studies: TableData[] = [
    {
      title: "0-10",
      value: "0"
    },
    {
      title: "11-100",
      value: "260"
    },
    {
      title: "101-10000",
      value: "450"
    },
    {
      title: "10001",
      value: "820"
    },
  ]

  projects: TableData[] = [
    {
      title: "<7",
      value: "1500"
    },
    {
      title: "7-14",
      value: "1500"
    },
    {
      title: "15-24",
      value: "2000"
    },
    {
      title: "25-34",
      value: "2500"
    },
    {
      title: "35-44",
      value: "2500"
    },
    {
      title: "45-54",
      value: "3000"
    },
    {
      title: "55-69",
      value: "3500"
    },
    {
      title: "70-84",
      value: "4000"
    },
    {
      title: "85-99",
      value: "4500"
    },
    {
      title: "100-129",
      value: "4500"
    },
    {
      title: "130-179",
      value: "4500"
    },
    {
      title: "180-229",
      value: "6000"
    },
    {
      title: "230-299",
      value: "7000"
    },
    {
      title: "300-499",
      value: "8000"
    },
    {
      title: "500-∞",
      value: "10000"
    },
  ]

  tables: Table[] = [
    {
      title: "Instal·lació",
      headers: ['Potència (kWp)', 'Ratio (€/kWp)'],
      data: this.installations
    },
    {
      title: "Inversors",
      headers: ['Potència (kWp)', 'Ratio (€/kWp)'],
      data: this.inverters
    },
    {
      title: "Panells",
      headers: ['Potència (kWp)', 'Ratio (€/kWp)'],
      data: this.panels
    },
    {
      title: "Autoritzacions de població",
      headers: ['Potència (kWp)', 'Cost (€)'],
      data: this.authorizations
    },
    {
      title: "Estructura",
      headers: ['Tipo', 'Ratio (€/kWp)'],
      data: this.structures
    },
    {
      title: "Sol·licitud i estudi punts d'accés",
      headers: ['Potència (kWp)', 'Cost (€)'],
      data: this.studies
    },
    {
      title: "Gestió de projectes",
      headers: ['Potència (kWp)', 'Cost (€)'],
      data: this.projects
    },
  ]

  selectedTable = this.tables[0]
  changeType(index: number){
    this.selectedTable = this.tables[index]
  }
}
