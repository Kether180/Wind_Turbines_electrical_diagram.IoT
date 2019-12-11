
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule as ngRouterModule, Routes } from '@angular/router';
import { CoreModule, BootstrapComponent, RouterModule } from '@c8y/ngx-components';

import { AppComponent } from './app.component';
import { DeviceDropDownComponent } from './device-drop-down/device-drop-down.component';
import { DeviceFilterDropDownComponent } from './device-filter-drop-down/device-filter-drop-down.component';

const routes: Routes = [
  { path: '', component: AppComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    DeviceDropDownComponent,
    DeviceFilterDropDownComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    ngRouterModule.forRoot(routes, { enableTracing: false, useHash: true }),
    CoreModule.forRoot()
  ],
  providers: [],
  bootstrap: [BootstrapComponent],

  // Allow custom svg elements which are exported from Microsoft Visio
  schemas: [ NO_ERRORS_SCHEMA ]
})
export class AppModule { }
