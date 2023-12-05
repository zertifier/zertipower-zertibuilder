import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {loggedIn} from "./features/auth/infrastructure/guards/session-guards";
import {pageAccess} from "./features/auth/infrastructure/guards/page-access-guard";

const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/infrastructure/pages/auth-pages.module").then((m) => m.AuthPagesModule),
  },
  {
    path: "users",
    loadChildren: () =>
      import("./features/users/infrastructure/pages/user-pages.module").then(
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
    loadChildren: () => import('./features/communities/communities.module').then(m => m.CommunitiesModule)
  },
  {
    path: 'cups',
    loadChildren: () => import('./features/cups/cups.module').then(m => m.CupsModule)
  },
  {
    path: 'customers',
    loadChildren: () => import('./features/customers/customers.module').then(m => m.CustomersModule)
  },
  {
    path: 'energy-blocks',
    loadChildren: () => import('./features/energy-blocks/energy-blocks.module').then(m => m.EnergyBlocksModule)
  },
  {
    path: 'energy-transactions',
    loadChildren: () => import('./features/energy-transactions/energy-transactions.module').then(m => m.EnergyTransactionsModule)
  },
  {
    path: 'energy-registers',
    loadChildren: () => import('./features/energy-registers/energy-registers.module').then(m => m.EnergyRegistersModule)
  },
  {
    path: 'energy-registers-hourly',
    loadChildren: () => import('./features/energy-registers-hourly/energy-registers-hourly.module').then(m => m.EnergyRegistersHourlyModule)
  },
  {
    path: 'providers',
    loadChildren: () => import('./features/providers/providers.module').then(m => m.ProvidersModule)
  },
  {
    path: 'smart-contracts',
    loadChildren: () => import('./features/smart-contracts/smart-contracts.module').then(m => m.SmartContractsModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: "**",
    pathMatch: "full",
    redirectTo: "users",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
