import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


import {RouterModule, Routes} from '@angular/router';

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {MineSweeperComponent} from './minesweeper.component';
import {MinesweeperFlagIconComponent} from "../../assets/icons/minesweeper/minesweeperFlag";

export const ROUTES: Routes = [
    {
        path: 'minesweeper',
        component: MineSweeperComponent,
    },
];


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        RouterModule.forChild(ROUTES),
        TooltipModule.forRoot(),
        FontAwesomeModule
    ],
    declarations: [
        MineSweeperComponent,
        MinesweeperFlagIconComponent
    ],

    exports: [
        MineSweeperComponent,
    ],
})
export class MinesweeperModule { }
