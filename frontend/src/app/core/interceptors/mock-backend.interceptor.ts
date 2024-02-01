import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {Injectable} from '@angular/core';

let customers = [
  {id: 1, name: 'customer_test1', wallet_address: '0x123pxv456'},
  {id: 2, name: 'customer_test2', wallet_address: '0x123pxv456'},
  {id: 3, name: 'customer_test3', wallet_address: '0x123pxv456'}
]

let communities = [
  {id: 1, name: 'community_test1', test: 1, energy_price: 0.5, lat: 41.5060, lng: 1.5000},
  {id: 1, name: 'community_test2', test: 1, energy_price: 0.5, lat: 41.5100, lng: 1.5020},
  {id: 1, name: 'community_test3', test: 1, energy_price: 0.5, lat: 41.5075, lng: 1.5053}
]

let energyAreas = [
  {id: 1, reference: 'area1'},
  {id: 2, reference: 'area2'},
  {id: 3, reference: 'area3'},
  {id: 4, reference: 'area4'}
]

let energyAreasCoordinates =
  [
    {id: 4, energy_area_id: 4, lat: 41.5050, lng: 1.5000},
    {id: 4, energy_area_id: 4, lat: 41.5055, lng: 1.4990},
    {id: 4, energy_area_id: 4, lat: 41.5060, lng: 1.4994},
    {id: 4, energy_area_id: 4, lat: 41.5050, lng: 1.5003},
    {id: 3, energy_area_id: 3, lat: 41.5070, lng: 1.5000},
    {id: 3, energy_area_id: 3, lat: 41.5065, lng: 1.4990},
    {id: 3, energy_area_id: 3, lat: 41.5070, lng: 1.4994},
    {id: 3, energy_area_id: 3, lat: 41.5075, lng: 1.5003},
    {id: 2, energy_area_id: 2, lat: 41.5070, lng: 1.5010},
    {id: 2, energy_area_id: 2, lat: 41.5065, lng: 1.5015},
    {id: 2, energy_area_id: 2, lat: 41.5075, lng: 1.5013},
    {id: 2, energy_area_id: 2, lat: 41.5070, lng: 1.5010},
    {id: 1, energy_area_id: 1, lat: 41.5080, lng: 1.5020},
    {id: 1, energy_area_id: 1, lat: 41.5085, lng: 1.5035},
    {id: 1, energy_area_id: 1, lat: 41.5095, lng: 1.5023},
    {id: 1, energy_area_id: 1, lat: 41.5090, lng: 1.5020}
  ]

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.handleRequests(req, next);
  }

  handleRequests(req: HttpRequest<any>, next: HttpHandler): any {
    let {url, method, params} = req; // Obtener la URL y el método de la solicitud
    const queryParams = getQueryParamsFromUrl(req.url);
    url = removeQueryParamsFromUrl(url);
    console.log(url)

    switch (true) {
      case url.endsWith('/customers') && method === 'GET':
        return ok({data: customers})
        break;
      case url.endsWith('/customers/cups') && method === 'GET':
        break;
      case url.endsWith('/communities') && method === 'GET':
        return ok({data: communities})
        break;
      case url.endsWith('/energy-areas/1') && method === 'GET':
        return ok({data: communities})
        break;
      case url.endsWith('/energy-areas/by-community') && method === 'GET':
        //let communityId = req.params.id
        console.log("community id:")
        return ok({data: communities})
        break;
      case url.endsWith('/energy-areas/by-area') && method === 'GET':
        //let communityId = req.params.id
        console.log(" queryParams ", queryParams)

        let lng = queryParams.lng;
        let lat = queryParams.lat;
        let radius = queryParams.radius;

        let coordinate = energyAreasCoordinates.filter((point:any) => {
          const distance = calculateDistance(lat, lng, point.lat, point.lng);
          return distance <= radius;
        });

        return ok({data: coordinate})
        break;
      default:
        return next.handle(req);
    }
  }
}

function ok(body
              :
              any
) {
  return of(new HttpResponse({status: 200, body}))
}

function error(message: any) {
  return throwError(() => new Error('Error'))
}

function unauthorized() {
  return throwError(() => new Error('Unautorized'))
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in kilometers
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getQueryParamsFromUrl(url: string): any {
  const params = new URLSearchParams(url.split('?')[1]);
  const queryParams: any = {};
  params.forEach((value, key) => {
    queryParams[key] = value;
  });
  return queryParams;
}

function getPointsWithinRadius(lat: number, lng: number, radius: number): any[] {
  // Implement point filtering logic here
  return [];
}

function removeQueryParamsFromUrl(_url: string): string {
  // Eliminar los query params de la URL
  return _url.split('?')[0];
}
