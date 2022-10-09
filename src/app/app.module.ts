import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { CodemirrorModule } from '../lib/public_api';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, CodemirrorModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
