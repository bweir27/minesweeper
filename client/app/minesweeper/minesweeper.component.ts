import {Component, OnDestroy, OnInit} from '@angular/core';
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

    CELL_SIZE = 40;
    CELLS_PER_ROW = 10;
    NUM_ROWS = 10;
    GAME_DIFFICULTY: 'easy' | 'medium' | 'hard' = 'easy';
    NUM_BOMBS = {
        easy: 10,
        medium: 20,
        hard: 30
    };

    gameCells: MineSweeperCell[] = [];
    gameStarted = false;
    isGameOver = false;
    numFlags: number;

    icons = {
        bomb: faBomb,
        pause: faPause
    };

    // time: Date = new Date();
    gameStartTime = moment();
    gameElapsedTime;
    timeSubscription: Subscription;

    constructor() {
        this.createGameBoard();
    }

    ngOnInit() { }

    ngOnDestroy(): void {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
    }

    startGame() {
        this.gameStarted = true;
        this.isGameOver = false;
        this.gameStartTime = moment();
        this.numFlags = this.NUM_BOMBS[this.GAME_DIFFICULTY];
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

    pauseGame() {
        // console.log('pause');
    }

    createGameBoard() {
        //create the game cells
        let safeCells: MineSweeperCell[] = Array((this.CELLS_PER_ROW * this.NUM_ROWS) - this.NUM_BOMBS[this.GAME_DIFFICULTY])
            .fill({
                    id: 0,
                    isRevealed: false,
                    isBomb: false,
                    isFlagged: false,
                    neighborBombs: 0,
                });
        let bombs: MineSweeperCell[] = Array(this.NUM_BOMBS[this.GAME_DIFFICULTY])
            .fill({
                id: 0,
                isRevealed: false,
                isBomb: true,
                isFlagged: false,
                neighborBombs: 0
            });
        //join the safeCells & bombs to become gameCells, shuffle them, and update their index to reflect their position
        this.gameCells = safeCells.concat(bombs)
            .sort(() => Math.random() - 0.5)
            .map((c, index) => {
                //ensure center 9 cells are empty
                return { ...c, id: index};
            });

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
        if(cell.isBomb) {
            this.displayGameLost();
        } else {
            cell.isRevealed = true;
            if(cell.neighborBombs > 0) {
                let elem = document.getElementById(`${cell.id}`);
                elem.classList.add(this.mapNumToWord(cell.neighborBombs));
                // elem.innerHTML = String(cell.neighborBombs);
                return;
            }
            this.checkCell(cell);
        }
        cell.isRevealed = true;
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
    }
    //check neighboring cells once cell is clicked
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

    checkGameOver(cell: MineSweeperCell): boolean {
        //check for loss
        if(cell.isBomb) {
            this.displayGameLost();
            return true;
        } else if(this.checkForGameWin()) {
            this.displayGameWon();
            return true;
        }
        return false;
    }
    displayGameLost() {
    //    TODO: make result display
        this.isGameOver = true;
        const elem = document.getElementById('gameEndMessage');
        console.log(elem);
        if(elem) elem.innerHTML = 'BOOM! You Lost!';
        console.log('Game Lost');
        this.revealBombs();
    }

    displayGameWon() {
        this.isGameOver = true;
        const elem = document.querySelector('p#gameEndMessage.gameEndMessage');
        console.log(elem);
        if(elem) elem.innerHTML = 'Congrats! You Won!';
        console.log('Game Won!');
        this.revealBombs();
    }

    //show all the bombs that have not already been revealed or flagged
    revealBombs() {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
        // console.log('revealing bombs');
        this.gameCells.forEach(c => {
            if(c.isBomb && !c.isFlagged) c.isRevealed = true;
        });
    }

    checkForGameLoss(): boolean {
        return this.gameCells.filter(c => c.isBomb).some(c => c.isRevealed);
    }
    checkForGameWin(): boolean {
        return this.gameCells
            .filter(c => !c.isBomb && c.isRevealed).length
            === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
    }


    //helpers
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
        const isTopEdge = cell.id < this.CELLS_PER_ROW;
        return !isTopEdge
            ? this.gameCells[cell.id - this.CELLS_PER_ROW] : undefined;
    }
    getCellSouthOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isBottomEdge = cell.id > this.gameCells.length - this.CELLS_PER_ROW;
        return !isBottomEdge
            ? this.gameCells[cell.id + this.CELLS_PER_ROW] : undefined;
    }
    getCellEastOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isRightEdge = cell.id % this.CELLS_PER_ROW === this.CELLS_PER_ROW - 1;
        return !isRightEdge
            ? this.gameCells[cell.id + 1] : undefined;
    }
    getCellWestOf(cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isLeftEdge = (cell.id > 0 && cell.id % this.CELLS_PER_ROW === 0);
        return !isLeftEdge
            ? this.gameCells[cell.id - 1] : undefined;
    }

    mapNumToWord(num: number) {
        return {
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
