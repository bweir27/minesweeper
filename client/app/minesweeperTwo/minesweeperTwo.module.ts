import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {RouterModule, Routes} from '@angular/router';

import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {MineSweeperTwoComponent} from './minesweeper.component';
import {MinesweeperFlagIconComponent} from '../../assets/icons/minesweeper/minesweeperFlag';
import { SassHelperComponent } from './SassHelper/sass-helper.component';

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
        FontAwesomeModule
    ],
    declarations: [
        MineSweeperTwoComponent,
        MinesweeperFlagIconComponent,
        SassHelperComponent,
    ],

    exports: [
        MineSweeperTwoComponent,
        MinesweeperFlagIconComponent,
        SassHelperComponent
    ],
})
export class MinesweeperModule { }
