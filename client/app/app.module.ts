import { NgModule, ApplicationRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';

import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { MinesweeperModule } from './minesweeper/minesweeper.module';
import { MinesweeperTwoModule } from './minesweeperTwo/minesweeperTwo.module';
import { DirectivesModule } from '../components/directives.module';
import { JwtModule } from '@auth0/angular-jwt';

export function tokenGetter() {
    return localStorage.getItem('id_token');
}

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: '/minesweeper',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/minesweeper',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [
        BrowserModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            headerName: 'x-csrf-token'
        }),
        BrowserAnimationsModule,
        JwtModule.forRoot({
            config: {
                tokenGetter
            }
        }),
        ReactiveFormsModule,
        RouterModule.forRoot(appRoutes, {
            enableTracing: process.env.NODE_ENV === 'development'
        }),
        MinesweeperModule,
        MinesweeperTwoModule,
        DirectivesModule,
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
    static parameters = [ApplicationRef];
    constructor(public appRef: ApplicationRef) {
        this.appRef = appRef;
    }
}
