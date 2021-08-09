import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { MineSweeperCell } from '../../components/types/minesweeper/cell';
import {
    faBomb,
    faPause
} from '@fortawesome/free-solid-svg-icons';
import { MinesweeperFlagIconComponent } from '../../assets/icons/minesweeper/minesweeperFlag';
import {Subscription, timer} from 'rxjs';
import {map, share} from 'rxjs/operators';
import moment from 'moment';


@Component({
    selector: 'minesweeper',
    templateUrl: './minesweeper.html',
    styleUrls: ['./minesweeper.scss'],
})
export class MineSweeperComponent implements OnInit, OnDestroy {
    @Input('difficulty') GAME_DIFFICULTY: 'easy' | 'medium' | 'hard' = 'hard';

    CELL_SIZE = 40;
    CELLS_PER_ROW = {
        easy: 8,
        medium: 16,
        hard: 30
    };

    NUM_ROWS = {
        easy: 8,
        medium: 16,
        hard: 16
    };

    NUM_BOMBS = {
        easy: 15,
        medium: 40,
        hard: 99
    };

    gameCells: MineSweeperCell[] = [];
    gameStarted = false;
    isGameOver = false;
    isGameWon: boolean;
    isPaused: boolean;
    pauseGameState: any;
    numFlags: number;
    numSafeCellsRevealed = 0;
    cellsPerRow: number = this.CELLS_PER_ROW[this.GAME_DIFFICULTY];
    numRows: number = this.NUM_ROWS[this.GAME_DIFFICULTY];
    numBombs: number = this.NUM_BOMBS[this.GAME_DIFFICULTY];

    icons = {
        bomb: faBomb,
        pause: faPause
    };

    // time: Date = new Date();
    gameStartTime = moment();
    gameElapsedTime = 0;
    timeSubscription: Subscription;

    constructor() {
        this.createGameBoard();
    }

    ngOnInit() {
        this.numFlags = this.numBombs;
        this.numSafeCellsRevealed = 0;
        const board = document.getElementsByClassName('minesweeper__container')[0];
        const scoreboard = document.getElementsByClassName('minesweeper__scoreboard')[0];
        if(board && scoreboard) {
            scoreboard.classList.add(`minesweeper__scoreboard--${this.GAME_DIFFICULTY}`);
            board.classList.add(`minesweeper__container--${this.GAME_DIFFICULTY}`);
        }
    }

    ngOnDestroy(): void {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
    }

    startGame() {
        this.gameStarted = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameStartTime = moment();
        this.numFlags = this.numBombs;
        this.numSafeCellsRevealed = 0;
        // Using RxJS Timer
        this.timeSubscription = timer(0, 1000)
            .pipe(
                map(() => moment()),
                share()
            )
            .subscribe(time => {
                this.gameElapsedTime = Math.floor(moment.duration(moment().diff(this.gameStartTime)).as('seconds'));
            });
        this.createGameBoard();
    }

    timer(callback, delay) {
        var timerId, start, remaining = delay;

        const pause = () => {
            window.clearTimeout((timerId));
            remaining -= Date.now() - start;
        };

        const resume = () => {
            start = Date.now();
            window.clearTimeout(timerId);
            timerId = window.setTimeout(callback, remaining);
        };
    }

    togglePause() {
        if(!this.gameStarted || this.isGameOver) return;

        //TODO: stop/resume timer
        if(!this.isPaused) {
            console.log('pause');
        } else {
            console.log('unpause');
        }
        this.isPaused = !this.isPaused;
    }

    createGameBoard() {
        const gameSetup = this.getGameboardDimensions();
        //create the game cells
        let safeCells: MineSweeperCell[] = Array((gameSetup.rows * gameSetup.cols) - gameSetup.numBombs)
            .fill({
                    id: 0,
                    isRevealed: false,
                    isBomb: false,
                    isFlagged: false,
                    neighborBombs: 0,
                });
        let bombs: MineSweeperCell[] = Array(gameSetup.numBombs)
            .fill({
                id: 0,
                isRevealed: false,
                isBomb: true,
                isFlagged: false,
                neighborBombs: 0
            });
        //join the safeCells & bombs to become gameCells, shuffle them, and update their index to reflect their position
        this.gameCells = safeCells.concat(bombs)
            //shuffle bombs around
            .sort(() => Math.random() - 0.5)
            //initialize id to be consistent with index / position on board
            .map((c, index) => {
                return { ...c, id: index};
            });

        // this.clearCenterCells(this.gameCells);

        this.initNeighborBombCount();
    }

    initNeighborBombCount() {
        let bombs = this.gameCells.filter(c => c.isBomb);
        bombs.forEach((b) => {
            const neighbors = this.getCellNeighbors(b);
            for (let cell in neighbors) {
                if(neighbors[cell] && !neighbors[cell].isBomb) this.gameCells[neighbors[cell].id].neighborBombs++;
            }
        });
    }

    clickCell(cell: MineSweeperCell) {
        if(!this.gameStarted || this.isGameOver) return;
        if(cell.isRevealed || cell.isFlagged) return;
        // console.log(cell);
        if(cell.isBomb) {
            this.displayGameLost();
        } else {
            cell.isRevealed = true;
            this.numSafeCellsRevealed++;
            if(cell.neighborBombs > 0) {
                let elem = document.getElementById(`${cell.id}`);
                elem.classList.add(this.mapNumToWord(cell.neighborBombs));
                this.isGameOver = this.checkGameOver(cell);
                return;
            }
            this.checkCell(cell);
            this.isGameOver = this.checkGameOver(cell);
        }
        cell.isRevealed = true;
    }

    //check neighboring cells once cell with 0 neighborBombs is clicked
    checkCell(cell: MineSweeperCell) {
        const neighbors = this.getCellNeighbors(cell);
        setTimeout(() => {
            for (let c in neighbors) {
                if(neighbors[c] && !neighbors[c].isBomb) {
                    const newCell = this.gameCells[neighbors[c].id];
                    this.clickCell(newCell);
                }
            }
        }, 10);
    }

    toggleFlag(cell: MineSweeperCell, ev: Event) {
        ev.preventDefault();
        if(this.isGameOver) return;
        if(!cell.isFlagged && this.numFlags > 0) {
            this.numFlags --;
            this.gameCells[cell.id].isFlagged = true;
        } else {
            this.numFlags++;
            this.gameCells[cell.id].isFlagged = false;
        }
        // this.isGameOver = this.checkGameOver(cell);
    }


    // ===== end game functions =====

    checkGameOver(cell: MineSweeperCell): boolean {
        //check for loss
        if(cell.isBomb && !cell.isFlagged) {
            this.displayGameLost();
            return true;
        } else if(!cell.isBomb && this.checkForGameWin()) {
            this.displayGameWon();
            return true;
        }
        return false;
    }

    displayGameLost() {
        this.isGameOver = true;
        this.isGameWon = false;
        console.log('Game Lost');
        this.revealBombs();
    }

    displayGameWon() {
        this.isGameOver = true;
        this.isGameWon = true;
        console.log('Game Won!');
        this.revealBombs();
    }

    //show all the bombs that have not already been revealed or flagged
    revealBombs() {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
        this.gameCells.forEach(c => {
            if(c.isBomb && !c.isFlagged) c.isRevealed = true;
        });
    }

    // checkForGameLoss(): boolean {
    //     return !this.isGameOver && this.gameCells.filter(c => c.isBomb).some(c => c.isRevealed);
    // }

    checkForGameWin(): boolean {
        return this.numSafeCellsRevealed === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
        // return this.gameCells
        //     .filter(c => !c.isBomb && c.isRevealed).length
        //     === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
    }


    //helpers
    getGameboardDimensions(): {rows: number, cols: number, numBombs: number} {
        return {
            rows: this.NUM_ROWS[this.GAME_DIFFICULTY],
            cols: this.CELLS_PER_ROW[this.GAME_DIFFICULTY],
            numBombs: this.NUM_BOMBS[this.GAME_DIFFICULTY]
        };
    }
    getCellNeighbors(cell: MineSweeperCell) {
        return {
            north: this.getCellNorthOf(cell),
            south: this.getCellSouthOf(cell),
            east: this.getCellEastOf(cell),
            west: this.getCellWestOf(cell),
            northeast: this.getCellEastOf(this.getCellNorthOf(cell)),
            southeast: this.getCellEastOf(this.getCellSouthOf(cell)),
            southwest: this.getCellWestOf(this.getCellSouthOf(cell)),
            northwest: this.getCellWestOf(this.getCellNorthOf(cell))
        };
    }
    getCellNorthOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isTopEdge = cell.id < this.CELLS_PER_ROW[this.GAME_DIFFICULTY];
        return !isTopEdge
            ? this.gameCells[cell.id - this.CELLS_PER_ROW[this.GAME_DIFFICULTY]] : undefined;
    }
    getCellSouthOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isBottomEdge = cell.id > this.gameCells.length - this.cellsPerRow;
        return !isBottomEdge
            ? this.gameCells[cell.id + this.cellsPerRow] : undefined;
    }
    getCellEastOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isRightEdge = cell.id % this.cellsPerRow === this.cellsPerRow - 1;
        return !isRightEdge
            ? this.gameCells[cell.id + 1] : undefined;
    }
    getCellWestOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isLeftEdge = (cell.id > 0 && cell.id % this.cellsPerRow === 0);
        return !isLeftEdge
            ? this.gameCells[cell.id - 1] : undefined;
    }

    mapNumToWord(num: number) {
        return {
            0: '',
            1: 'one',
            2: 'two',
            3: 'three',
            4: 'four',
            5: 'five',
            6: 'six',
            7: 'seven',
            8: 'eight'
        }[num];
    }

}
