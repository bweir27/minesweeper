import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {defaultCell, MineSweeperCell} from '../../components/types/minesweeper/cell';
import {faBomb, faPause} from '@fortawesome/free-solid-svg-icons';
import {GameConfig} from './GameConfig';
import {getCellEastOf, getCellNorthOf, getCellSouthOf, getCellWestOf} from './helpers';
import Heap from '../../components/interfaces/Heap';
import {shuffle} from '../../components/util';

type DIFFICULTY_OPTIONS = 'easy' | 'medium' | 'hard';

@Component({
    selector: 'minesweeper',
    templateUrl: './minesweeper.html',
    styleUrls: ['./minesweeper.scss'],
})
export class MineSweeperComponent implements OnInit, OnDestroy {
    @Input('difficulty') GAME_DIFFICULTY: DIFFICULTY_OPTIONS = 'medium';

    difficultyOptions: DIFFICULTY_OPTIONS[] = ['easy', 'medium', 'hard'];

    /* board dimensions / number of bombs for levels of difficulty taken from https://datagenetics.com/blog/june12012/index.html */
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
        hard: 99,
        // hard: 470
    };

    cascadeAnimationDuration = 10;
    welcomeMessage = 'Welcome, please select a difficulty to start the game';
    gameConfig: GameConfig;
    gameCells: MineSweeperCell[] = [];
    cellHeap: Heap<MineSweeperCell>;
    isFirstClick = true;
    gameStarted = false;
    isGameOver = false;
    isGameWon: boolean;
    isPaused = true;
    // animateBombs = false;
    animateBombTimeouts = [];
    pauseGameState: any;
    numFlags: number;
    numSafeCellsRevealed = 0;

    icons = {
        bomb: faBomb,
        pause: faPause
    };

    gameElapsedTime = 0;
    gameClock;
    timeSubscription: any;

    numToWordMap = {
        0: '',
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight'
    };

    constructor() {
        this.createGameBoard();
        this.gameElapsedTime = 0;
    }

    ngOnInit() {
        this.numFlags = 0;
        this.numSafeCellsRevealed = 0;
        this.gameStarted = false;
        this.resetGameState(this.GAME_DIFFICULTY);
    }

    ngOnDestroy(): void {
        if(this.timeSubscription) this.timeSubscription.unsubscribe();
    }

    resetGameState(selectedDifficulty: DIFFICULTY_OPTIONS) {
        this.gameStarted = false;
        this.isFirstClick = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.numFlags = 0;
        this.numSafeCellsRevealed = 0;
        this.gameElapsedTime = 0;

        // handle game reset before bomb reveal animation over
        this.animateBombTimeouts.forEach(t => clearTimeout(t));

        const board = document.getElementsByClassName('minesweeper__container')[0];
        const scoreboard = document.getElementsByClassName('minesweeper__scoreboard')[0];
        if(board && scoreboard) {
            scoreboard.classList.remove(`minesweeper__scoreboard--${this.GAME_DIFFICULTY}`);
            board.classList.remove(`minesweeper__container--${this.GAME_DIFFICULTY}`);
            scoreboard.classList.add(`minesweeper__scoreboard--${selectedDifficulty}`);
            board.classList.add(`minesweeper__container--${selectedDifficulty}`);
        }
        this.GAME_DIFFICULTY = selectedDifficulty;
        this.gameConfig = this.getGameboardDimensions();
    }

    startGame(selectedDifficulty: DIFFICULTY_OPTIONS) {
        this.resetGameState(selectedDifficulty);
        // override some settings that were set in resetGameState
        this.gameStarted = true;
        this.numFlags = this.NUM_BOMBS[selectedDifficulty];
        this.gameConfig = this.getGameboardDimensions();
        this.animateBombTimeouts = [];

        this.startTimer();
        this.cellHeap = new Heap<MineSweeperCell>((nodeA, nodeB) => {
            return nodeA.id - nodeB.id;
        });
        this.cellHeap.push(...this.createGameBoard());
        this.gameCells = [...this.cellHeap.heapArray];
    }

    startTimer() {
        this.gameClock = setInterval(() => {
            this.gameElapsedTime++;
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.gameClock);
    }

    togglePause() {
        if(!this.gameStarted || this.isGameOver) return;

        if(!this.isPaused) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
        this.isPaused = !this.isPaused;
    }

    /**
     * createGameBoard:
     */
    createGameBoard(): MineSweeperCell[] {
        const gameSetup = this.getGameboardDimensions();
        const numCells = gameSetup.numRows * gameSetup.cellsPerRow; //gameSetup.numRows * gameSetup.numCols;
        // a shuffled list of numbers in range [0, numCells]
        let positionOptions = shuffle([...Array(numCells).keys()]);

        //create the game cells
        let safeCells = Array(numCells - gameSetup.numBombs)
            .fill({...defaultCell, isBomb: false});
        // let safeCells = Array((gameSetup.numRows * gameSetup.numCols) - gameSetup.numBombs)
        //     .fill({...defaultCell, isBomb: false});
        let bombs = Array(gameSetup.numBombs).fill(({...defaultCell, isBomb: true}));

        //join the safeCells & bombs to become gameCells
        let gameCells = safeCells
            .concat(bombs) //join the safeCells & bombs to become gameCells,
            //shuffle them, and update their index to reflect their position
            .map((c, index) => ({ ...c, id: positionOptions.pop()}))
            .sort((a, b) => a.id - b.id); // sort the list by cell IDs

            // ** uncomment this for first-click bomb-relocation testing (ensure bombs start in corners) **
            // .map(c => {
            //     if (this.isCorner(c)) return {...c, isBomb: true};
            //     return {...c, isBomb: c.isBomb};
            // });
        return this.initNeighborBombCount(gameCells);
    }

    /**
     * initNeighborBombCount: for each bomb on the board, set its neighbors' neighborBombs value
     * @param cells
     */
    initNeighborBombCount(cells: MineSweeperCell[]): MineSweeperCell[] {
        // reset all neighborBombCounts to 0
        let board = cells.map(c => ({...c, neighborBombs: 0}));
        let bombs = board.filter(c => c.isBomb);

        // technically O(8n) where n = the number of bombs;
        // and in the worst-case, the cell is not on the edge and all 8 neighbors need checked
        bombs.forEach((b) => {
            let neighbors = this.getCellNeighbors(board, b, this.gameConfig);
            Object.values(neighbors).forEach(key => {
                if(key && !key.isBomb) board[key.id].neighborBombs += 1;
            });
        });
        return board;
    }

    /**
     * clickCell: The main driving function when a cell is clicked.
     *      determines how the game board responds to the click
     * @param { MineSweeperCell }   cell: the Cell that has just been clicked
     */
    clickCell(cell: MineSweeperCell) {
        // prevent action if game isn't ongoing
        if(!this.gameStarted || this.isGameOver) return;
        // ignore cells that are either already revealed or have been flagged
        if(cell.isRevealed || cell.isFlagged) return;

        // prevent clicking on bomb on first turn
        if(this.isFirstClick) {
            // ensure that the first click results in a cascade effect
            this.gameCells = [...this.ensureFirstClickCascade(this.gameCells, cell)];
            cell = this.gameCells[cell.id];
            this.isFirstClick = false;
        } else if(cell.isBomb) {
            this.displayGameLost(cell);
            return;
        }

        cell.isRevealed = true;
        this.numSafeCellsRevealed++;

        if (cell.neighborBombs > 0) {
            let elem = document.getElementById(`${cell.id}`);
            // update elem classes
            Object.entries(this.getCellClasses(cell))
                .forEach(([key, value]) => { if (value) elem.classList.add(key); });
            // elem.classList.add(this.mapNumToWord(cell.neighborBombs));
        } else {
            // clicked cell has no adjacent bombs, start recursive reveal cascade
            this.checkCell(cell);
        }
        this.isGameOver = this.checkGameOver(cell);
    }

    /**
     * checkCell: check neighboring cells once cell with 0 neighborBombs is clicked
     * @param { MineSweeperCell } cell
     */
    checkCell(cell: MineSweeperCell) {
        if(cell.neighborBombs > 0) return; // safeguard

        const neighbors = this.getCellNeighbors(this.gameCells, cell, this.gameConfig);
        setTimeout(() => {
            for (let c in neighbors) {
                // if neighbor isn't a bomb, reveal it (clickCell will handle previously revealed cells)
                if(neighbors[c] && !neighbors[c].isBomb) {
                    const newCell = this.gameCells[neighbors[c].id];
                    this.clickCell(newCell);
                }
            }
        }, this.cascadeAnimationDuration);
    }

    /**
     * ensureFirstClickCascade
     * @param { MineSweeperCell[] } allCells
     * @param { MineSweeperCell } clickedCell
     * @returns: { MineSweeperCell[] } updated GameBoard
     */
    ensureFirstClickCascade(allCells: MineSweeperCell[], clickedCell: MineSweeperCell): MineSweeperCell[] {
        let cells = [...allCells];
        const clickedCellId = clickedCell.id;
        let checkCorners = true;

        // the neighbors of the clicked cell
        let neighbors = Object.values(this.getCellNeighbors(allCells, clickedCell)).filter(c => !!c);
        // if any of the neighbors are bombs
        let neighborsHasBomb = neighbors.some(c => c.isBomb);

        const avoidIDs: Set<number> = new Set<number>();
        avoidIDs.add(clickedCellId);
        neighbors.forEach(n => avoidIDs.add(n.id));

        while(neighborsHasBomb || cells[clickedCellId].isBomb) {
            let node;
            if(cells[clickedCellId].isBomb) {
                node = cells[clickedCellId];
                checkCorners = true;
            } else {
                node = neighbors.find(c => c.isBomb);
                checkCorners = Math.random() < 0.5;
            }
            cells = this.relocateBomb(cells, node, avoidIDs);

            neighbors = Object.values(this.getCellNeighbors(cells, cells[clickedCellId])).filter(c => !!c && !c.isFlagged);
            neighborsHasBomb = neighbors.some(c => c.isBomb);
        }
        return cells;
    }

    /**
     * isCorner
     * @param { MineSweeperCell}  cell
     * @param config
     * @return: whether or not the specified Cell is in the corner of the board
     */
    isCorner(cell: MineSweeperCell, config?: GameConfig): boolean {
        if(!config) config = this.getGameboardDimensions();
        const cornerIds = [
            0,                                          // topLeft
            config.cellsPerRow - 1,                     // topRight
            this.gameCells.length - 1,                  // bottomRight
            this.gameCells.length - config.cellsPerRow  // bottomLeft
        ];
        return cornerIds.includes(cell.id);
    }

    /**
     * toggleFlag: toggles whether or not a specified cell is flagged
     * @param cell
     * @param ev
     */
    toggleFlag(cell: MineSweeperCell, ev: Event) {
        ev.preventDefault();
        if(this.isGameOver) return;
        if(!cell.isFlagged && this.numFlags > 0) {
            this.numFlags--;
            this.gameCells[cell.id].isFlagged = true;
        } else {
            this.numFlags++;
            this.gameCells[cell.id].isFlagged = false;
        }
    }


    // ===== end game functions =====
    checkGameOver(cell: MineSweeperCell): boolean {
        //check for loss (bomb clicked)
        if(cell.isBomb && !cell.isFlagged) {
            this.displayGameLost(cell);
            return true;
        } else if(!cell.isBomb && this.checkForGameWin()) {
            this.displayGameWon();
            return true;
        }
        return false;
    }
    checkForGameWin(): boolean {
        return this.numSafeCellsRevealed === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
    }

    displayGameLost(cell: MineSweeperCell) {
        this.isGameOver = true;
        this.isGameWon = false;
        console.log('Game Lost');
        this.animateRevealBombs(cell);
        this.pauseTimer();
    }

    displayGameWon() {
        this.isGameOver = true;
        this.isGameWon = true;
        console.log('Game Won!');
        // this.revealBombs();
        this.pauseTimer();
    }

    animateRevealBombs(cell: MineSweeperCell) {
        var heap = this.revealBombs3(cell);
        let i = 0;
        let delay = this.cascadeAnimationDuration;
        let interval = 50;

        while(heap.length > 0) {
            const c = heap.pop();
            i += 1;
            if( c && c.isBomb && !c.isFlagged ) {
                this.revealCell(c, delay + (interval * i));
            }
        }
    }

    /**
     * revealBombs3: returns the list of bombs sorted according to their cardinal distance from the startCell
     *
     * @param { MineSweeperCell } startCell
     */
    revealBombs3(startCell: MineSweeperCell): any[] {
        this.reInitCellIdsAndLocation(this.gameCells);
        // returns the list of bombs sorted according to their cardinal distance from the startCell
        return this.gameCells
            .filter(c => c.isBomb && !c.isFlagged)
            .sort((a, b) => {
                const distToA = this.distanceBetweenCells(startCell, a);
                const distToB = this.distanceBetweenCells(startCell, b);
                return distToB - distToA;
            });
    }


    // === helpers ===
    private getGameboardDimensions(): GameConfig {
        return {
            numRows: this.NUM_ROWS[this.GAME_DIFFICULTY],
            numCols: this.CELLS_PER_ROW[this.GAME_DIFFICULTY],
            numBombs: this.NUM_BOMBS[this.GAME_DIFFICULTY],
            cellsPerRow: this.CELLS_PER_ROW[this.GAME_DIFFICULTY]
        };
    }

    /**
     * getCellNeighbors: returns the list of cells that are adjacent to
     * @param { MineSweeperCell[] } allCells
     * @param { MineSweeperCell }   cell
     * @param { GameConfig }        config
     */
    private getCellNeighbors(allCells: MineSweeperCell[], cell: MineSweeperCell, config?: GameConfig) {
        if(!config) config = this.getGameboardDimensions();
        let cellList = [...allCells];
        return {
            north: getCellNorthOf(cellList, cell, config),
            south: getCellSouthOf(cellList, cell, config),
            east: getCellEastOf(cellList, cell, config),
            west: getCellWestOf(cellList, cell, config),
            northeast: getCellEastOf(cellList, getCellNorthOf(cellList, cell, config), config),
            southeast: getCellEastOf(cellList, getCellSouthOf(cellList, cell, config), config),
            southwest: getCellWestOf(cellList, getCellSouthOf(cellList, cell, config), config),
            northwest: getCellWestOf(cellList, getCellNorthOf(cellList, cell, config), config)
        };
    }

    /**
     * getCellAt: returns a cell in the grid that corresponds with a (x, y) coordinate where the top-left corner is (0,0)
     * @param x: the x-coordinate
     * @param y: the y-coordinate
     * (x+1) - x = 1
     * (y+1) - y = cellsPerRow
     */
    private getCellAt(x: number, y: number): any {
        const index = (this.gameConfig.cellsPerRow * y) + x;
        return this.gameCells[index];
    }

    /**
     * getCellCoords: calculates and returns the (x,y) coordinates of a given cell
     * @param args
     */
    private getCellCoords(args: {cell?: MineSweeperCell, index?: number}): {x: number, y: number} {
        let {cell, index} = args;
        if (args.index === undefined && !args.cell === undefined) {
            console.error('must provide either an index or a cell', args);
            throw new Error('must provide either an index or a cell');
        }
        if (index && cell && index !== cell.id) throw new Error('index and cell.id mismatch');
        if (!index && cell) index = cell.id;

        //    y = floor(index / cellsPerRow)
        //    x = index % cellsPerRow
        const x = index > this.gameConfig.cellsPerRow
            ? index % this.gameConfig.cellsPerRow
            : index;
        const y = index > 0 ? Math.floor(index / this.gameConfig.cellsPerRow) : 0;

        return {
            x: x,
            y: y
        };
    }

    /**
     * revealCell: reveals a Cell after a specified delay
     * @param cell
     * @param delay
     */
    private revealCell(cell: any, delay = 0) {
        const { id } = cell;
        const timeId = setTimeout(() => {
            this.gameCells[id].isRevealed = true;
        }, delay);
        if(cell.isBomb) {
            this.animateBombTimeouts.push(timeId);
        }
    }

    /**
     * relocateBomb: if a bomb is clicked on the first turn,
     *      move the bomb to a corner as is [convention](https://web.archive.org/web/20180618103640/http://www.techuser.net/mineclick.html)
     *      iff the top-left corner is already occupied by a bomb, use top-right, then bottom-right, then bottom-left
     *      iff all four corners are occupied by bombs (likelihood varies by difficulty), re-initialize the board
     *      after the bomb has been moved (one way or another),
     * @param { MineSweeperCell[] } allCells
     * @param { MineSweeperCell }   clickedCell
     * @param { Set<number> }       avoidIds: invalid swap destinations
     */
    private relocateBomb(allCells: MineSweeperCell[], clickedCell: MineSweeperCell, avoidIds: Set<number>): MineSweeperCell[] {
        if(!clickedCell.isBomb || !this.isFirstClick) return allCells;

        let gameBoard = allCells;
        let swapCell: MineSweeperCell;

        const topLeftCell = gameBoard[0];
        const topRightCell = gameBoard[this.gameConfig.cellsPerRow - 1];
        const bottomRightCell = gameBoard[gameBoard.length - 1];
        const bottomLeftCell = gameBoard[gameBoard.length - this.gameConfig.cellsPerRow];

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
            /* undefined cell prevented by assumptions that:
                    a.) there are > 1 safe cells in the game,
                    b.) this segment only runs if isFirstClick
             */
            let viableCells = gameBoard
                .filter(c => !c.isBomb && c.id !== clickedCell.id && !c.isRevealed && !avoidIds.has(c.id));
            let cellId = Math.floor(Math.random() * viableCells.length);
            swapCell = viableCells[cellId];
        }
        // gameBoard = this.swapCells(gameBoard, clickedCell, swapCell);
        return this.swapCells(gameBoard, clickedCell, swapCell);
    }

    /**
     * swapCells: swaps the positions of two MineSweeperCells
     * @param { MineSweeperCell[] } allCells
     * @param { MineSweeperCell}    a
     * @param { MineSweeperCell }   b
     */
    private swapCells(allCells: MineSweeperCell[], a: MineSweeperCell, b: MineSweeperCell): MineSweeperCell[] {
        // perform the swap
        [allCells[a.id], allCells[b.id]] = [allCells[b.id], allCells[a.id]];

        // reset the ids and neighborBombCount of each cell
        allCells = allCells.map((c, index) => {
            const { x, y } = this.getCellCoords({index: index});
            return {
                ...c,
                id: index,
                neighborBombs: 0,
                x: x,
                y: y
            };
        });
        return this.initNeighborBombCount(allCells);
    }

    mapNumToWord(num: number): string {
        return this.numToWordMap[num];
    }

    /**
     * getCellClasses: determines and returns the CSS classes for a specified cell
     * @param cell
     */
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

    /**
     * getWelcomeMessageFontSize
     *      We use the height of the board to calculate the font size because we know for
     *      "easy" board, width == height, and we want the font size to be the same for
     *      "medium" and "hard" boards, which have differing widths, but equal heights
     */
    getWelcomeMessageFontSize() {
        const board = document.getElementById('gameContainer');
        const boardHeight = window.getComputedStyle(board).getPropertyValue('height');
        const parsedHeightVal = Number(boardHeight.split(new RegExp(/[A-Z]/, 'gi'))[0]);
        const parsedHeightUnit = boardHeight.split(new RegExp(/[0-9]/, 'gi')).pop();
        // we want the text to fit comfortably within the game container, 0.049 is a bit of a magic number
        const computedFontSize = parsedHeightVal * 0.049;
        return `font-size: ${computedFontSize}px;`;
    }

    /**
     * reInitCellIdsAndLocation:
     * 0(n)
     * @param cells
     */
    private reInitCellIdsAndLocation(cells: any[]): any[] {
        return cells.map((c, index) => {
            const coords = this.getCellCoords({index: index || 0});
            return {
                ...c,
                id: index,
                x: coords.x,
                y: coords.y
            };
        });
    }

    /**
     * distanceBetweenCells: calculates and returns the cardinal distance between two game Cells
     * @param { MineSweeperCell }   cellA
     * @param { MineSweeperCell }   cellB
     * @returns { number } the cardinal distance between the two cells
     */
    private distanceBetweenCells(cellA: MineSweeperCell, cellB: MineSweeperCell): number {
        let coordsA = this.getCellCoords({cell: cellA});
        let coordsB = this.getCellCoords({cell: cellB});

        let x = coordsA.x - coordsB.x;
        let y = coordsA.y - coordsB.y;
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }
}
