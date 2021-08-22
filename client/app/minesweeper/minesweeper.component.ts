import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { MineSweeperCell } from '../../components/types/minesweeper/cell';
import {
    faBomb,
    faPause
} from '@fortawesome/free-solid-svg-icons';
import { MinesweeperFlagIconComponent } from '../../assets/icons/minesweeper/minesweeperFlag';
import { timer} from 'rxjs';

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
        easy: 15, //60 used for first-click bomb-relocation testing
        medium: 40,
        hard: 99
    };

    gameCells: MineSweeperCell[] = [];
    isFirstClick = true;
    gameStarted = false;
    isGameOver = false;
    isGameWon: boolean;
    isPaused: boolean = true;
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

    gameElapsedTime: number = 0;
    interval;
    timeSubscription: any;

    constructor() {
        this.createGameBoard();
        this.gameElapsedTime = 0;
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
        // clearInterval(this.gameTimer);
        this.gameStarted = true;
        this.isFirstClick = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.cellsPerRow = this.CELLS_PER_ROW[this.GAME_DIFFICULTY];
        this.numFlags = this.numBombs;
        this.numSafeCellsRevealed = 0;
        this.gameElapsedTime = 0;
        this.startTimer();
        this.gameCells = this.createGameBoard();
    }

    observableTimer() {
        const source = timer(1000, 2000);
        const abc = source.subscribe(val => {
            console.log(val, '-');
            this.timeSubscription = val;
        });
    }

    startTimer() {
        console.log('startTimer');
        this.interval = setInterval(() => {
            this.gameElapsedTime++;
        }, 1000);
    }

    pauseTimer() {
        console.log('pauseTimer');
        clearInterval(this.interval);
    }

    togglePause() {
        console.log('togglePause: ', this.isPaused);
        if(!this.gameStarted || this.isGameOver) return;

        //TODO: stop/resume timer
        if(!this.isPaused) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
        this.isPaused = !this.isPaused;
    }

    createGameBoard(): MineSweeperCell[] {
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
        let gameCells = safeCells.concat(bombs)
            //shuffle bombs around
            .sort(() => Math.random() - 0.5)
            //initialize id to be consistent with index / position on board
            .map((c, index) => ({ ...c, id: index}));
            // uncomment this for first-click bomb-relocation testing (ensure bombs start in corners)
            // .map(c => {
            //     if (this.isCorner(c)) return {...c, isBomb: true};
            //     return {...c, isBomb: c.isBomb};
            // });
        return this.initNeighborBombCount([...gameCells]);
    }

    initNeighborBombCount(cells: MineSweeperCell[], includeSelf?: boolean): MineSweeperCell[] {
        // console.log('initNeighborBombCount');
        let board = [...cells];
        let bombs = board.filter(c => c.isBomb);
        // console.log('numBombs: ', bombs.length);
        bombs.forEach((b) => {
            let neighbors = this.getCellNeighbors(board, b);
            let keys = Object.values(neighbors);
            keys.forEach(key => {
                if(key && !key.isBomb) board[key.id].neighborBombs += 1;
                // if(neighbors[key] && !neighbors[key].isBomb) board[neighbors[key].id].neighborBombs += 1;
                // if(v && v.isRevealed) console.log('revealed neighbor: ', v);
            });
        });
        return board;
    }

    initSingleNeighborBombCount(cell: MineSweeperCell): MineSweeperCell {
        // console.log('cell: ', cell);
        cell.neighborBombs = 0;
        let neighbors = this.getCellNeighbors(this.gameCells, cell);
        // console.log('neighbors: ', neighbors);
        let keys = Object.values(neighbors);
        keys.forEach(key => {
            // if(neighbors[key] && !neighbors[key].isBomb) this.gameCells[neighbors[key].id].neighborBombs += 1;
            // console.log(key);
            if(key && key.isBomb) this.gameCells[cell.id].neighborBombs += 1;
            // if(v && v.isRevealed) console.log('revealed neighbor: ', v);
        });
        return cell;
    }

    clickCell(cell: MineSweeperCell) {
        if(!this.gameStarted || this.isGameOver) return;
        if(cell.isRevealed || cell.isFlagged) return;
        if(this.isFirstClick) {
            this.gameCells = [...this.handleFirstClickBomb([...this.gameCells], cell)];
            cell = this.gameCells[cell.id];
            this.isFirstClick = false;
        } else if(cell.isBomb) {
            this.displayGameLost();
        }
        cell.isRevealed = true;
        this.numSafeCellsRevealed++;
        if (cell.neighborBombs > 0) {
            let elem = document.getElementById(`${cell.id}`);
            elem.classList.add(this.mapNumToWord(cell.neighborBombs));
            this.isGameOver = this.checkGameOver(cell);
            return;
        }
        this.checkCell(cell);
        this.isGameOver = this.checkGameOver(cell);
    }

    //check neighboring cells once cell with 0 neighborBombs is clicked
    checkCell(cell: MineSweeperCell) {
        const neighbors = this.getCellNeighbors(this.gameCells, cell);
        setTimeout(() => {
            for (let c in neighbors) {
                if(neighbors[c] && !neighbors[c].isBomb) {
                    const newCell = this.gameCells[neighbors[c].id];
                    this.clickCell(newCell);
                }
            }
        }, 10);
    }

    /**
     * handleFirstClickBomb: if a bomb is clicked on the first turn,
     *      move the bomb to a corner as is [convention](https://web.archive.org/web/20180618103640/http://www.techuser.net/mineclick.html)
     *      iff the top-left corner is already occupied by a bomb, use top-right, then bottom-right, then bottom-left
     *      iff all four corners are occupied by bombs (likelihood varies by difficulty), re-initialize the board
     *      after the bomb has been moved (one way or another),
     * @param allCells
     * @param clickedCell
     */
    handleFirstClickBomb(allCells: MineSweeperCell[], clickedCell: MineSweeperCell): MineSweeperCell[] {
        if(!clickedCell.isBomb || !this.isFirstClick) return allCells;
        let gameBoard = [...allCells];
        let topLeftCell = gameBoard[0];
        let topRightCell = gameBoard[this.cellsPerRow - 1];
        let bottomRightCell = gameBoard[gameBoard.length - 1];
        let bottomLeftCell = gameBoard[gameBoard.length - this.cellsPerRow];
        let swapCell;
        //check top-left corner
        if(!topLeftCell.isBomb && topLeftCell.id !== clickedCell.id) {
            swapCell = topLeftCell;
        } else if(!topRightCell.isBomb && topRightCell.id !== clickedCell.id) {
            swapCell = topRightCell;
        } else if(!bottomRightCell.isBomb && bottomRightCell.id !== clickedCell.id) {
            swapCell = bottomRightCell;
        } else if(!bottomLeftCell.isBomb && bottomLeftCell.id !== clickedCell.id) {
            swapCell = bottomLeftCell;
        }
        if(!swapCell) {
            //none of the corners are viable swaps, swap bomb with random viable (safe) cell
            // console.log('taking the long way');
            /* undefined cell prevented by assumptions that:
                    a.) there are > 1 safe cells in the game,
                    b.) and that this segment only runs if isFirstClick)
             */
            let viableCells = gameBoard.filter(c => !c.isBomb && c.id !== clickedCell.id && !c.isRevealed);
            let cellId = Math.floor(Math.random() * viableCells.length);
            swapCell = viableCells[cellId];
        }
        return this.swapCells(gameBoard, clickedCell, swapCell);
    }

    isCorner(cell: MineSweeperCell) {
        // [topLeft, topRight, bottomRight, bottomLeft]
        const cornerIds = [
            0,
            this.cellsPerRow - 1,
            this.gameCells.length - 1,
            this.gameCells.length - this.cellsPerRow
        ];
        return cornerIds.includes(cell.id);
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
        this.pauseTimer();
    }

    displayGameWon() {
        this.isGameOver = true;
        this.isGameWon = true;
        console.log('Game Won!');
        this.revealBombs();
        this.pauseTimer();
    }

    //show all the bombs that have not already been revealed or flagged
    revealBombs() {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
        this.gameCells.forEach(c => {
            if(c.isBomb && !c.isFlagged) c.isRevealed = true;
        });
    }

    checkForGameWin(): boolean {
        return this.numSafeCellsRevealed === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
    }


    //helpers
    getGameboardDimensions(): {rows: number, cols: number, numBombs: number} {
        return {
            rows: this.NUM_ROWS[this.GAME_DIFFICULTY],
            cols: this.CELLS_PER_ROW[this.GAME_DIFFICULTY],
            numBombs: this.NUM_BOMBS[this.GAME_DIFFICULTY]
        };
    }

    getCellNeighbors(allCells: MineSweeperCell[], cell: MineSweeperCell) {
        let cellList = [...allCells];
        return {
            north: this.getCellNorthOf(cellList, cell),
            south: this.getCellSouthOf(cellList, cell),
            east: this.getCellEastOf(cellList, cell),
            west: this.getCellWestOf(cellList, cell),
            northeast: this.getCellEastOf(cellList, this.getCellNorthOf(cellList, cell)),
            southeast: this.getCellEastOf(cellList, this.getCellSouthOf(cellList, cell)),
            southwest: this.getCellWestOf(cellList, this.getCellSouthOf(cellList, cell)),
            northwest: this.getCellWestOf(cellList, this.getCellNorthOf(cellList, cell))
        };
    }
    getCellNorthOf(allCells: MineSweeperCell[], cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isTopEdge = cell.id < this.CELLS_PER_ROW[this.GAME_DIFFICULTY];
        return !isTopEdge
            ? allCells[cell.id - this.CELLS_PER_ROW[this.GAME_DIFFICULTY]] : undefined;
    }
    getCellSouthOf(allCells: MineSweeperCell[], cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isBottomEdge = cell.id > allCells.length - this.CELLS_PER_ROW[this.GAME_DIFFICULTY];
        return !isBottomEdge ? allCells[cell.id + this.CELLS_PER_ROW[this.GAME_DIFFICULTY]] : undefined;
    }
    getCellEastOf(allCells: MineSweeperCell[], cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isRightEdge = cell.id % this.CELLS_PER_ROW[this.GAME_DIFFICULTY] === this.CELLS_PER_ROW[this.GAME_DIFFICULTY] - 1;
        return !isRightEdge ? allCells[cell.id + 1] : undefined;
    }
    getCellWestOf(allCells: MineSweeperCell[], cell: MineSweeperCell): MineSweeperCell {
        if (!cell) return undefined;
        const isLeftEdge = (cell.id > 0 && cell.id % this.cellsPerRow === 0);
        return !isLeftEdge
            ? allCells[cell.id - 1] : undefined;
    }

    swapCells(allCells: MineSweeperCell[], a: MineSweeperCell, b: MineSweeperCell): MineSweeperCell[] {
        [allCells[a.id], allCells[b.id]] = [allCells[b.id], allCells[a.id]];
        //reset the ids and neighborBombCount of each cell
        allCells = allCells.map((c, index) => ({...c, id: index, neighborBombs: 0}));
        return this.initNeighborBombCount(allCells);
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

    getCellClasses(cell: MineSweeperCell) {
        if(!cell.isRevealed) return {};
        const numClassName = this.mapNumToWord(cell.neighborBombs);
        let baseClasses = {
            'revealed': cell.isRevealed,
            // 'isCorner': this.isCorner(cell),
            'isBomb': cell.isBomb,
        };
        baseClasses[numClassName] = cell.isRevealed;
        return baseClasses;
    }

}
