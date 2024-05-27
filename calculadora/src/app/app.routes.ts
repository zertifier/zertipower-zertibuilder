import { Routes } from '@angular/router';
import { SelectLocationComponent } from './pages/select-location/select-location.component';

export const routes: Routes = [
    { path: 'search/:id', loadChildren: () => import('./pages/search/search.module').then(m => m.SearchModule) },
    {path:'select-location', component:SelectLocationComponent},
    { path: '**', redirectTo: 'select-location' }  
];