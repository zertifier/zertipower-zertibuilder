import { firstValueFrom } from 'rxjs';
import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class EnergyAreasService {

  private solarAccessToken?: string;
  hasSolarSession() { return !!this.solarAccessToken; }
  clearSolarSession() { this.solarAccessToken = undefined; }
  async loginForSolar(user: string, password: string) {
    const response: any = await firstValueFrom(this.http.post(`${environment.api_url}/auth/login`, { user, password }));
    if (!response.success || !response.data?.access_token) throw new Error('Login failed');
    this.solarAccessToken = response.data.access_token;
  }
  private solarHeaders() { return { Authorization: `Bearer ${this.solarAccessToken || ''}` }; }

  saveSelection(input: any) { return firstValueFrom(this.http.post<any>(`${environment.api_url}/roof-simulation/community-selections`, input)); }
  listSelections(communityId: number) { return firstValueFrom(this.http.get<any>(`${environment.api_url}/roof-simulation/community-selections`, {params:{community:communityId}})); }
  removeSelection(communityId: number, areaId: number) { return firstValueFrom(this.http.delete<any>(`${environment.api_url}/roof-simulation/community-selections`, {params:{community:communityId,area:areaId}})); }
  consumption(communityId: number, cupsId?: number | null) {
    const params:any={community:communityId}; if(cupsId) params.cups=cupsId;
    return firstValueFrom(this.http.get<any>(`${environment.api_url}/roof-simulation/calculator-consumption`,{params}));
  }

  baseUrl = `${environment.api_url}/energy-areas`;

  constructor(private http: HttpClient) {

  }

  simulateRoof(input: { latitude: number; longitude: number; kwp: number; tilt: number; azimuth: number; areaM2: number; panelCount: number }) {
    return this.http.post(`${environment.api_url}/roof-simulation`, input);
  }

  saveCommunityRoof(input: { communityId: number; roofReference: string; latitude: number; longitude: number;
    areaM2: number; tilt: number; azimuth: number; panelCount: number; kwp: number; energyAreaId?: number; inverterPowerKw?: number | null }) {
    return this.http.post(`${environment.api_url}/roof-simulation/community-roof`, input, { headers: this.solarHeaders() });
  }

  deleteCommunityRoof(communityId: number, roofReference: string) {
    return this.http.delete(`${environment.api_url}/roof-simulation/community-roof`, {
      params: { community: communityId, reference: roofReference }, headers: this.solarHeaders(),
    });
  }

  getByCommunity(communityId: number) {
    let url = `${this.baseUrl}/by-community?id=${communityId}`;
    return this.http.get(url);
  }

  getByLocation(locationId:number){
    let url = `${this.baseUrl}/by-location?id=${locationId}`;
    return this.http.get(url);
  }

  /**
   * @param lat
   * @param lng
   * @param radius in kilometers */
  getByArea(lat: number, lng: number, radius: number = 1) {
    let url = `${this.baseUrl}/by-area?lat=${lat}&lng=${lng}&radius=${radius}`;
    return this.http.get(url);
  }

  simulate(lat:number,lng:number,m2:number,orientation:number,inclination:number,n_plaques:number, energyAreaId?: number){
    let url = `${this.baseUrl}/simulate?lat=${lat}&lng=${lng}&area=${m2}&direction=${orientation}&angle=${inclination}&panels=${n_plaques}`;
    if (energyAreaId != null) url += `&energyAreaId=${energyAreaId}`;
    return this.http.get(url);
  }

}

