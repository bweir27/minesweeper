import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CellNeighbors, defaultCell, MineSweeperCell} from './MinesweeperCell';
import {faBomb, faPause} from '@fortawesome/free-solid-svg-icons';
import {GameConfig} from './GameConfig';
import Heap from '../../components/interfaces/Heap';
import {MinesweeperGrid} from './MinesweeperGrid';
type DIFFICULTY_OPTIONS = 'easy' | 'medium' | 'hard';

@Component({
    selector: 'minesweeperTwo',
    templateUrl: './minesweeperTwo.html',
    styleUrls: ['./minesweeperTwo.scss'],
})
export class MineSweeperTwoComponent implements OnInit, OnDestroy {
    @Input('difficulty') GAME_DIFFICULTY: DIFFICULTY_OPTIONS = 'medium';

    difficultyOptions: DIFFICULTY_OPTIONS[] = ['easy', 'medium', 'hard'];

    CELL_SIZE = 40;

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
        // hard: 478
    };

    cascadeAnimationDuration = 10;
    welcomeMessage = 'Welcome, please select a difficulty to start the game';
    gameGrid: MinesweeperGrid;
    cellHeap: Heap<MineSweeperCell>;
    isFirstClick = true;
    gameStarted = false;
    isGameOver = false;
    isGameWon: boolean;
    isPaused = true;
    pauseGameState: any;
    numFlags: number;
    numSafeCellsRevealed = 0;

    icons = {
        bomb: faBomb,
        pause: faPause
    };

    gameElapsedTime = 0;
    interval;
    timeSubscription: any;

    constructor() {
        this.gameElapsedTime = 0;
    }


    ngOnInit() {
        this.createGameBoard();
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
        const board = document.getElementsByClassName('minesweeper__container')[0];
        const scoreboard = document.getElementsByClassName('minesweeper__scoreboard')[0];
        if(board && scoreboard) {
            scoreboard.classList.remove(`minesweeper__scoreboard--${this.GAME_DIFFICULTY}`);
            board.classList.remove(`minesweeper__container--${this.GAME_DIFFICULTY}`);
            scoreboard.classList.add(`minesweeper__scoreboard--${selectedDifficulty}`);
            board.classList.add(`minesweeper__container--${selectedDifficulty}`);
        }
        this.GAME_DIFFICULTY = selectedDifficulty;
    }

    startGame(selectedDifficulty: DIFFICULTY_OPTIONS) {
        this.resetGameState(selectedDifficulty);
        // override some settings that were set in resetGameState
        this.gameStarted = true;
        this.numFlags = this.NUM_BOMBS[selectedDifficulty];

        this.startTimer();
        this.gameGrid = new MinesweeperGrid(this.getGameboardDimensions());
        this.gameGrid.init(this.getGameboardDimensions());
        // this.cellHeap = new Heap<MineSweeperCell>((nodeA, nodeB) => {
        //     return nodeA.id - nodeB.id;
        // });
        // this.cellHeap.push(...this.createGameBoard());
    }

    startTimer() {
        this.interval = setInterval(() => {
            this.gameElapsedTime++;
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.interval);
    }

    togglePause() {
        if(!this.gameStarted || this.isGameOver) return;

        //TODO: stop/resume timer
        if(!this.isPaused) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
        this.isPaused = !this.isPaused;
    }

    createGameBoard() {
        if(!this.GAME_DIFFICULTY) this.GAME_DIFFICULTY = 'medium';
        const gameSetup = this.getGameboardDimensions();
        this.gameGrid = new MinesweeperGrid(gameSetup);
        this.gameGrid.init(gameSetup);
    }

    clickCell(cell: MineSweeperCell) {
        if(!this.gameStarted || this.isGameOver) return;
        if(cell.isRevealed || cell.isFlagged) return;
        console.log(cell);
        if(this.isFirstClick) {
            this.gameGrid.cells = [...this.ensureFirstClickCascade(this.gameGrid.cells, cell)];
            cell = this.gameGrid.cells[cell.id];
            this.isFirstClick = false;
        } else if(this.gameGrid.isMine(cell.id)) {
            this.displayGameLost(cell);
        }
        cell.isRevealed = true;
        this.numSafeCellsRevealed++;
        if (cell.neighborBombs > 0) {
            let elem = document.getElementById(`${cell.id}`);
            Object.entries(this.getCellClasses(cell))
                .forEach(([key, value]) => { if (value) elem.classList.add(key); });
            // elem.classList.add(this.mapNumToWord(cell.neighborBombs));
            this.isGameOver = this.checkGameOver(cell);
            return;
        }
        this.checkCell(cell);
        this.isGameOver = this.checkGameOver(cell);
    }

    //check neighboring cells once cell with 0 neighborBombs is clicked
    checkCell(cell: MineSweeperCell) {
        const neighbors = this.gameGrid.getCellNeighbors(cell);
        setTimeout(() => {
            for (let c in neighbors) {
                if(neighbors[c] && !neighbors[c].isBomb) {
                    const newCell = this.gameGrid.cells[neighbors[c].id];
                    this.clickCell(newCell);
                }
            }
        }, this.cascadeAnimationDuration);
    }


    ensureFirstClickCascade(allCells: MineSweeperCell[], clickedCell: MineSweeperCell): MineSweeperCell[] {
        let cells = [...allCells];
        const clickedCellId = clickedCell.id;
        let selfIsBomb = this.gameGrid.isMine(clickedCell.id);
        let checkCorners = true;

        let neighbors = Object.values(this.gameGrid.getCellNeighbors(clickedCell)).filter(c => !!c);
        let neighborsHasBomb = neighbors.some(c => this.gameGrid.isMine(c.id));
        while(neighborsHasBomb || selfIsBomb) {
            let node;
            if(selfIsBomb) {
                node = cells[clickedCellId];
                checkCorners = true;
            } else {
                node = neighbors.find(c => this.gameGrid.isMine(c.id));
                checkCorners = Math.random() < 0.5;
            }
            cells = this.relocateBomb(cells, node, checkCorners);

            neighbors = Object.values(this.gameGrid.getCellNeighbors(clickedCell)).filter(c => !!c);
            neighborsHasBomb = neighbors.some(c => this.gameGrid.isMine(c.id));
        }
        return cells;
    }

    /**
     * relocateBomb: if a bomb is clicked on the first turn,
     *      move the bomb to a corner as is [convention](https://web.archive.org/web/20180618103640/http://www.techuser.net/mineclick.html)
     *      iff the top-left corner is already occupied by a bomb, use top-right, then bottom-right, then bottom-left
     *      iff all four corners are occupied by bombs (likelihood varies by difficulty), re-initialize the board
     *      after the bomb has been moved (one way or another),
     * @param { MineSweeperCell[] } allCells
     * @param { MineSweeperCell }   clickedCell
     * @param { boolean }           checkCorners
     */
    private relocateBomb(allCells: MineSweeperCell[], clickedCell: MineSweeperCell, checkCorners: boolean = true): MineSweeperCell[] {
        if(!this.gameGrid.isMine(clickedCell.id) || !this.isFirstClick) return allCells;

        const isMine = this.gameGrid.isMine;
        let gameBoard = [...allCells];
        let topLeftCell = gameBoard[0];
        let topRightCell = gameBoard[this.gameGrid.gameConfig.cellsPerRow - 1];
        let bottomRightCell = gameBoard[gameBoard.length - 1];
        let bottomLeftCell = gameBoard[gameBoard.length - this.gameGrid.gameConfig.cellsPerRow];
        let swapCell;
        if(checkCorners) {
            //check top-left corner
            if(!isMine(topLeftCell.id) && topLeftCell.id !== clickedCell.id) {
                swapCell = topLeftCell;
            } else if(!isMine(topRightCell.id) && topRightCell.id !== clickedCell.id) {
                swapCell = topRightCell;
            } else if(!isMine(bottomRightCell.id) && bottomRightCell.id !== clickedCell.id) {
                swapCell = bottomRightCell;
            } else if(!isMine(bottomLeftCell.id) && bottomLeftCell.id !== clickedCell.id) {
                swapCell = bottomLeftCell;
            }
        }
        if(!swapCell) {
            //none of the corners are viable swaps, swap bomb with random viable (safe) cell
            /* undefined cell prevented by assumptions that:
                    a.) there are > 1 safe cells in the game,
                    b.) and that this segment only runs if isFirstClick)
             */
            let viableCells = gameBoard.filter(c => !isMine(c.id) && c.id !== clickedCell.id && !c.isRevealed);
            let cellId = Math.floor(Math.random() * viableCells.length);
            swapCell = viableCells[cellId];
        }
        gameBoard = this.swapCells(gameBoard, clickedCell, swapCell);
        const gameBoardSorted = this.isSorted(gameBoard);
        console.log('isSorted: ', gameBoardSorted);
        return gameBoard;
    }

    isCorner(cell: MineSweeperCell, config?: GameConfig) {
        if(!config) config = this.getGameboardDimensions();
        // [topLeft, topRight, bottomRight, bottomLeft]
        const cornerIds = [
            0,
            config.cellsPerRow - 1,
            this.gameGrid.getNumCells() - 1,
            this.gameGrid.getNumCells() - config.cellsPerRow
        ];
        return cornerIds.includes(cell.id);
    }

    toggleFlag(cell: MineSweeperCell, ev: Event) {
        ev.preventDefault();
        if(this.isGameOver) return;
        if(!cell.isFlagged && this.numFlags > 0) {
            this.numFlags --;
        } else {
            this.numFlags++;
        }
        this.gameGrid.toggleFlag(cell.id);
    }


    // ===== end game functions =====
    checkGameOver(cell: MineSweeperCell): boolean {
        //check for loss
        if(this.gameGrid.isMine((cell.id)) && !cell.isFlagged) {
            this.displayGameLost(cell);
            return true;
        } else if(!this.gameGrid.isMine((cell.id)) && this.checkForGameWin()) {
            this.displayGameWon();
            return true;
        }
        return false;
    }

    displayGameLost(cell: MineSweeperCell) {
        this.isGameOver = true;
        this.isGameWon = false;
        console.log('Game Lost');
        // this.revealBombs(cell);
        // this.revealBombs2(cell);
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

    // show all the bombs that have not already been revealed or flagged
    /*
    revealBombs(cell: MineSweeperCell, inspectedCells?: Set<MineSweeperCell>) {
        if(!cell) return;
        // if(!cell || cell.passedOver || this.gameCells[cell.id].passedOver) return;
        if (!inspectedCells) inspectedCells = new Set<MineSweeperCell>();
        if (inspectedCells.has(cell)) return;
        if (cell.isBomb) cell.isRevealed = true;
        cell.passedOver = true;
        cell.passedNum += 1;
        inspectedCells.add(cell);
        const neighbors = this.getUnvisitedNeighbors(this.gameCells, cell, this.gameConfig);
        let keys = Object.values(neighbors).filter(c => c && !(c.passedOver || this.gameCells[c.id].passedOver));
        // keys.forEach(k => inspectedCells.add(k));

        keys.forEach(key => {
            setTimeout(() => {
                this.revealBombs(this.gameCells[key.id], inspectedCells);
                // inspectedCells.add(key);
            }, this.cascadeAnimationDuration);
        });

        // keys.forEach(k => inspectedCells.add(k));
        return inspectedCells;

        // setTimeout(() => {
        //     // keys.filter(c => c && !(c.passedOver || this.gameCells[c.id].passedOver))
        //     keys
        //         // .filter(c => c && !(c.passedOver || this.gameCells[c.id].passedOver))
        //         // .filter(c => !!c)
        //         // .filter(c => c && !inspectedCells.has(c))
        //         .forEach(key => {
        //             // const newCell = this.gameCells[key.id];
        //             this.revealBombs(this.gameCells[key.id], inspectedCells);
        //         });
        // }, 1);

        // this.gameCells.filter(c => c.isBomb && !c.isFlagged).forEach(c => {
        //     setTimeout(() => { c.isRevealed = true; }, 200);
        // });
    }
     */

    animateRevealBombs(cell: MineSweeperCell) {
        var heap = this.revealBombs2(cell).clone();
        heap.heapify();
        let i = 0;
        let delay = this.cascadeAnimationDuration;

        while(!heap.isEmpty()) {
            const c = heap.pop();
            i += 1;
            if( c && c.isBomb && !c.isFlagged ) {
                // delay += (delay < 1000) ? 10 : 0;
                if (delay < 150) delay += 10;
                // setTimeout(() => {
                //     this.gameCells[c.id].isRevealed = true;
                // }, this.cascadeAnimationDuration * i);
                this.revealCell(c, delay);
            }
        }
    }

    revealBombs2(cell: MineSweeperCell): Heap<any> {
        const openList = new Heap<any>((nodeA, nodeB) => {
            return nodeA.dist - nodeB.dist;
        });
        var animationList = new Heap<any>((nodeA, nodeB) => {
            return nodeA.dist - nodeB.dist;
        });
        const abs = Math.abs;
        const SQRT2 = Math.SQRT2;
        let node: any;
        var neighbors: any[];
        var neighbor: any, i, l, x, y, ng;

        let startNode: any = cell;
        let startPos = this.getCellCoords({cell: cell});

        startNode.g = 0;
        startNode.dist = 0;
        startNode.x = startPos.x;
        startNode.y = startPos.y;

        openList.push(startNode);
        startNode.passedOver = true;
        startNode.opened = true;

        // while the open list is not empty
        while (!openList.isEmpty()) {
            node = openList.pop();
            // console.log('node: ', node);
            node.closed = true;

            // get neighbors of the current node
            neighbors = Object.values(this.gameGrid.getCellNeighbors(node.id))
                .filter(c => !!c);

            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (!neighbor || neighbor.closed) {
                    continue;
                }

                neighbor.passedNum += 1;

                let neighborPos = (!!neighbor.x && !!neighbor.y)
                    ? {x: neighbor.x, y: neighbor.y}
                    : this.getCellCoords({cell: neighbor});

                x = neighborPos.x;
                y = neighborPos.y;

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!neighbor.opened || ng < neighbor.g) {
                    neighbor.g = ng;
                    neighbor.x = x;
                    neighbor.y = y;
                    neighbor.dist = neighbor.g;
                    neighbor.parent = node;

                    if (!neighbor.opened) {
                        openList.push(neighbor);
                        animationList.push(neighbor);
                        neighbor.opened = true;
                    } else {
                        // the neighbor can be reached with smaller cost.
                        // Since its f value has been updated, we have to
                        // update its position in the open list
                        openList.updateItem(openList.heapArray, neighbor);
                        animationList.updateItem(animationList.heapArray, neighbor);
                    }
                }
            } // end for each neighbor
        } // end while not open list empty
        return animationList;
    }

    checkForGameWin(): boolean {
        return this.numSafeCellsRevealed === this.gameGrid.cells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
    }

    //helpers
    getGameboardDimensions():  GameConfig {
        return {
            numRows: this.NUM_ROWS[this.GAME_DIFFICULTY],
            numCols: this.CELLS_PER_ROW[this.GAME_DIFFICULTY],
            numBombs: this.NUM_BOMBS[this.GAME_DIFFICULTY],
            cellsPerRow: this.CELLS_PER_ROW[this.GAME_DIFFICULTY]
        };
    }

    getCellNeighbors(cell: number): CellNeighbors {
        return this.gameGrid.getCellNeighbors(this.gameGrid.cells[cell]);
    }

    /**
     * getCellAt: returns a cell in the grid that corresponds with a (x, y) coordinate where the top-left corner is (0,0)
     * @param x: the x-coordinate
     * @param y: the y-coordinate
     * (x+1) - x = 1
     * (y+1) - y = cellsPerRow
     */
    getCellAt(x: number, y: number): any {
        const index = (this.gameGrid.gameConfig.cellsPerRow * y) + x;
        return this.gameGrid.getCell(index);
    }

    //    y = floor(index / cellsPerRow)
    //    x = index % cellsPerRow
    getCellCoords(args: {cell?: MineSweeperCell, index?: number}): {x: number, y: number} {
        let {cell, index} = args;
        if (!args.index && !args.cell) {
            console.log('index: ', args.index);
            index = 0;
            // throw new Error('must provide either an index or a cell');
        }
        if (index && cell && index !== cell.id) throw new Error('index and cell.id mismatch');
        if (!index && cell) index = cell.id;

        const x = index > this.gameGrid.gameConfig.cellsPerRow
            ? index % this.gameGrid.gameConfig.cellsPerRow
            : index;
        const y = index > 0 ? Math.floor(index / this.gameGrid.gameConfig.cellsPerRow) : 0;

        return {
            x: x,
            y: y
        };
    }

    revealCell(cell: any, delay?: number) {
        if(!delay) delay = 0;
        const { id } = cell;
        setTimeout(() => {
            this.gameGrid.revealCell(id);
        }, delay);
    }

    /*
    getUnvisitedNeighbors(allCells: MineSweeperCell[], cell: MineSweeperCell, config?: GameConfig) {
        if(!config) config = this.getGameboardDimensions();
        let cellList = [...allCells];
        const north     = getCellNorthOf(cellList, cell, config);
        const south     = getCellSouthOf(cellList, cell, config);
        const east      = getCellEastOf(cellList, cell, config);
        const west      = getCellWestOf(cellList, cell, config);
        const northeast = getCellEastOf(cellList, getCellNorthOf(cellList, cell, config), config);
        const southeast = getCellEastOf(cellList, getCellSouthOf(cellList, cell, config), config);
        const southwest = getCellWestOf(cellList, getCellSouthOf(cellList, cell, config), config);
        const northwest = getCellWestOf(cellList, getCellNorthOf(cellList, cell, config), config);

        return {
            north: (north && !north.passedOver ? north : undefined),
            south: (south && !south.passedOver ? south : undefined),
            east: (east && !east.passedOver ? east : undefined),
            west: (west && !west.passedOver ? west : undefined),
            northeast: (northeast && !northeast.passedOver ? northeast : undefined),
            southeast: (southeast && !southeast.passedOver ? southeast : undefined),
            southwest: (southwest && !southwest.passedOver ? southwest : undefined),
            northwest: (northwest && !northwest.passedOver ? northwest : undefined)
        };
    }
     */

    swapCells(allCells: MineSweeperCell[], a: MineSweeperCell, b: MineSweeperCell): any[] {
        [allCells[a.id], allCells[b.id]] = [allCells[b.id], allCells[a.id]];
        allCells = this.reInitCellIdsAndLocation(allCells);
        // let neighbors = Object.values(this.getCellNeighbors(allCells, allCells[a.id]))
        //     .push(Object.values(this.getCellNeighbors(allCells, allCells[b.id])));

        // this.initSingleNeighborBombCount(allCells[a.id], allCells);
        // this.initSingleNeighborBombCount(allCells[b.id], allCells);
        // return allCells;

        // reset the ids and neighborBombCount of each cell
        allCells = allCells.map((c, index) => {
            const { x, y } = this.getCellCoords({index: index});
            return Object.assign(c, {
                ...c,
                id: index,
                neighborBombs: 0,
                x: x,
                y: y
            });
        });
        return this.gameGrid.initNeighborBombCount(allCells);
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
            'isBomb': this.gameGrid.isMine(cell.id),
        };
        baseClasses[numClassName] = cell.isRevealed;
        return baseClasses;
    }

    getWelcomeMessageFontSize() {
        /*
            We use the height of the board to calculate the font size because we know for
            "easy" board, width == height, and we want the font size to be the same for
            "medium" and "hard" boards, which have differing widths, but equal heights
         */
        const board = document.getElementById('gameContainer');
        const boardHeight = window.getComputedStyle(board).getPropertyValue('height');
        const parsedHeightVal = Number(boardHeight.split(new RegExp(/[A-Z]/, 'gi'))[0]);
        const parsedHeightUnit = boardHeight.split(new RegExp(/[0-9]/, 'gi')).pop();
        // we want the text to fit comfortably within the game container, 0.049 is a bit of a magic number
        const computedFontSize = parsedHeightVal * 0.049;
        return `font-size: ${computedFontSize}px;`;
    }

    isSorted(cells: any[]): boolean {
        return !cells.some((c, index) => {
            if (c.id !== index) console.log('out of place: ', c);
            return c.id !== index;
        });
    }

    /**
     * reInitCellIdsAndLocation:
     * 0(n)
     * @param cells
     */
    reInitCellIdsAndLocation(cells: any[]): any[] {
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
}
