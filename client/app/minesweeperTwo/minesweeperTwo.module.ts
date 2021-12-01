import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {RouterModule, Routes} from '@angular/router';

import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {MineSweeperTwoComponent} from './minesweeperTwo.component';
import {MinesweeperFlagIconComponent} from '../../assets/icons/minesweeper/minesweeperFlag';
import {MinesweeperModule} from "../minesweeper/minesweeper.module";

export const ROUTES: Routes = [
    {
        path: 'minesweeperTwo',
        component: MineSweeperTwoComponent,
    },
];


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        RouterModule.forChild(ROUTES),
        TooltipModule.forRoot(),
        FontAwesomeModule,
        MinesweeperModule,
    ],
    declarations: [
        MineSweeperTwoComponent,
    ],

    exports: [
        MineSweeperTwoComponent,
    ],
})
export class MinesweeperTwoModule { }
