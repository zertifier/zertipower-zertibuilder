import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {loggedIn} from "./features/auth/guards/session-guards";
import {pageAccess} from "./features/auth/guards/page-access-guard";
import { SelectLocationComponent } from "./features/select-location/select-location.component";

const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/pages/auth-pages.module").then((m) => m.AuthPagesModule),
  },
  {
    path: "users",
    loadChildren: () =>
      import("./features/users/pages/user-pages.module").then(
        (m) => m.UserPagesModule,
      ),
    canActivate: [loggedIn, pageAccess('users')],
  },
  {
    path: "permissions",
    loadChildren: () =>
      import("./features/permissions/infrastructure/pages/permissions-pages.module").then(
        (m) => m.PermissionsPagesModule,
      ),
  },
  {
    path: "reports",
    loadChildren: () =>
      import("./features/reports/infrastructure/pages/reports-pages.module").then(
        (m) => m.ReportsPagesModule,
      ),
    canActivate: [loggedIn, pageAccess('reports')]
  },
  {
    path: 'calendar',
    loadChildren: () => import('./features/calendar/calendar.module').then(m => m.CalendarModule)
  },
  {
    path: 'communities',
    loadChildren: () => import('./features/communities/communities.module').then(m => m.CommunitiesModule),
    canActivate: [loggedIn, pageAccess('communities')],
  },
  {
    path: 'cups',
    loadChildren: () => import('./features/cups/cups.module').then(m => m.CupsModule),
    canActivate: [loggedIn, pageAccess('customers')],
  },
  {
    path: 'customers',
    loadChildren: () => import('./features/customers/customers.module').then(m => m.CustomersModule),
    canActivate: [loggedIn, pageAccess('customers')],
  },
  {
    path: 'energy-blocks',
    loadChildren: () => import('./features/energy-blocks/energy-blocks.module').then(m => m.EnergyBlocksModule),
    canActivate: [loggedIn, pageAccess('energyBlocks')],
  },
  {
    path: 'energy-transactions',
    loadChildren: () => import('./features/energy-transactions/energy-transactions.module').then(m => m.EnergyTransactionsModule),
    canActivate: [loggedIn, pageAccess('energyTransactions')],
  },
  {
    path: 'energy-registers',
    loadChildren: () => import('./features/energy-registers/energy-registers.module').then(m => m.EnergyRegistersModule),
    canActivate: [loggedIn, pageAccess('energyRegisters')],
  },
  {
    path: 'energy-registers-hourly',
    loadChildren: () => import('./features/energy-registers-hourly/energy-registers-hourly.module').then(m => m.EnergyRegistersHourlyModule),
    canActivate: [loggedIn, pageAccess('energyRegistersHourly')],
  },
  {
    path: 'energy-hourly',
    loadChildren: () => import('./features/energy-hourly/energy-hourly.module').then(m => m.EnergyHourlyModule),
    canActivate: [loggedIn, pageAccess('energyHourly')],
  },
  {
    path: 'providers',
    loadChildren: () => import('./features/providers/providers.module').then(m => m.ProvidersModule),
    canActivate: [loggedIn, pageAccess('providers')],
  },
  {
    path: 'smart-contracts',
    loadChildren: () => import('./features/smart-contracts/smart-contracts.module').then(m => m.SmartContractsModule),
    canActivate: [loggedIn, pageAccess('smartContracts')],
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [loggedIn],
  },
  {
    path: 'proposals',
    loadChildren: () => import('./features/proposals/proposals.module').then(m => m.ProposalsModule),
    canActivate: [loggedIn, pageAccess('proposals')],
  },
  {
    path: 'proposals-options',
    loadChildren: () => import('./features/proposals-options/proposals-options.module').then(m => m.ProposalsOptionsModule),
    canActivate: [loggedIn, pageAccess('proposals-options')],
  },
  {
    path: 'responses',
    loadChildren: () => import('./features/responses/responses.module').then(m => m.ResponsesModule),
    canActivate: [loggedIn, pageAccess('responses')],
  },
  {
    path: 'betas',
    loadChildren: () => import('./features/shares/shares.module').then(m => m.SharesModule),
    canActivate: [loggedIn, pageAccess('betas')],
  },
  // {
  //   path: 'search',
  //   loadChildren: () => import('./features/search/search.module').then(m => m.SearchModule),
  //   canActivate:[loggedIn]
  // },
  // {
  //   path: 'search/:id',
  //   loadChildren: () => import('./features/search/search.module').then(m => m.SearchModule),
  //   canActivate:[loggedIn]
  // },
  // {
  //   path:'select-location',
  //   component:SelectLocationComponent,
  //   canActivate:[loggedIn]
  // },
  {
    path: 'logs',
    loadChildren: () => import('./features/logs/logs.module').then(m => m.LogsModule),
    canActivate:[loggedIn],
  },
  {
    path: "**",
    pathMatch: "full",
    redirectTo: "dashboard"
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
