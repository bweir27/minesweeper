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
        // hard: 470
    };

    cascadeAnimationDuration = 10;
    welcomeMessage = 'Welcome, please select a difficulty to start the game';
    gameConfig: GameConfig;
    gameCells: MineSweeperCell[] = [];
    cellHeap: Heap<MineSweeperCell>;
    game2DCells: MineSweeperCell[][];
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

        this.startTimer();
        this.cellHeap = new Heap<MineSweeperCell>((nodeA, nodeB) => {
            return nodeA.id - nodeB.id;
        });
        this.cellHeap.push(...this.createGameBoard());
        this.gameCells = [...this.cellHeap.heapArray];
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

    createGameBoard(): MineSweeperCell[] {
        const gameSetup = this.getGameboardDimensions();
        const numCells = gameSetup.numRows * gameSetup.numCols;
        let positionOptions = shuffle(Array.from(Array(gameSetup.numRows * gameSetup.cellsPerRow).keys()));
        //create the game cells
        let safeCells = Array((gameSetup.numRows * gameSetup.numCols) - gameSetup.numBombs).fill({...defaultCell, isBomb: false});
        let bombs = Array(gameSetup.numBombs).fill(({...defaultCell, isBomb: true}));
        //join the safeCells & bombs to become gameCells, shuffle them, and update their index to reflect their position
        let gameCells = safeCells.concat(bombs)
            .map((c, index) => ({ ...c, id: positionOptions.pop()}))
            .sort((a, b) => a.id - b.id);
            // uncomment this for first-click bomb-relocation testing (ensure bombs start in corners)
            // .map(c => {
            //     if (this.isCorner(c)) return {...c, isBomb: true};
            //     return {...c, isBomb: c.isBomb};
            // });
        return this.initNeighborBombCount(gameCells);
    }

    initNeighborBombCount(cells: MineSweeperCell[], includeSelf?: boolean): MineSweeperCell[] {
        let board = [...cells];
        let bombs = board.filter(c => c.isBomb);
        bombs.forEach((b) => {
            let neighbors = this.getCellNeighbors(board, b, this.gameConfig);
            let keys = Object.values(neighbors);
            keys.forEach(key => {
                if(key && !key.isBomb) board[key.id].neighborBombs += 1;
            });
        });
        return board;
    }

    initSingleNeighborBombCount(cell: MineSweeperCell, allCells?: any[]): MineSweeperCell {
        if (!allCells) allCells = this.gameCells;
        cell.neighborBombs = 0;
        let neighbors = this.getCellNeighbors(allCells, cell, this.gameConfig);
        let keys = Object.values(neighbors);
        keys.reduce((prev, key) => {
            if(key && key.isBomb) return prev += 1;
            return prev;
        }, cell.neighborBombs);
        return cell;
    }

    clickCell(cell: MineSweeperCell) {
        if(!this.gameStarted || this.isGameOver) return;
        if(cell.isRevealed || cell.isFlagged) return;
        if(this.isFirstClick) {
            this.gameCells = [...this.ensureFirstClickCascade(this.gameCells, cell)];
            cell = this.gameCells[cell.id];
            this.isFirstClick = false;
        } else if(cell.isBomb) {
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
        const neighbors = this.getCellNeighbors(this.gameCells, cell, this.gameConfig);
        setTimeout(() => {
            for (let c in neighbors) {
                if(neighbors[c] && !neighbors[c].isBomb) {
                    const newCell = this.gameCells[neighbors[c].id];
                    this.clickCell(newCell);
                }
            }
        }, this.cascadeAnimationDuration);
    }


    ensureFirstClickCascade(allCells: MineSweeperCell[], clickedCell: MineSweeperCell): MineSweeperCell[] {
        let cells = [...allCells];
        const clickedCellId = clickedCell.id;
        const selfIsBomb = cells[clickedCellId].isBomb;
        let checkCorners = true;

        let neighbors = Object.values(this.getCellNeighbors(allCells, clickedCell)).filter(c => !!c);
        let neighborsHasBomb = neighbors.some(c => c.isBomb);
        while(neighborsHasBomb || cells[clickedCellId].isBomb) {
            let node;
            if(cells[clickedCellId].isBomb) {
                node = cells[clickedCellId];
                checkCorners = true;
            } else {
                node = neighbors.find(c => c.isBomb);
                checkCorners = Math.random() < 0.5;
            }
            cells = this.relocateBomb(cells, node, checkCorners);

            neighbors = Object.values(this.getCellNeighbors(cells, cells[clickedCellId])).filter(c => !!c && !c.isFlagged);
            neighborsHasBomb = neighbors.some(c => c.isBomb);
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
    private relocateBomb(allCells: MineSweeperCell[], clickedCell: MineSweeperCell, checkCorners = true): MineSweeperCell[] {
        if(!clickedCell.isBomb || !this.isFirstClick) return allCells;

        let gameBoard = [...allCells];
        let topLeftCell = gameBoard[0];
        let topRightCell = gameBoard[this.gameConfig.cellsPerRow - 1];
        let bottomRightCell = gameBoard[gameBoard.length - 1];
        let bottomLeftCell = gameBoard[gameBoard.length - this.gameConfig.cellsPerRow];
        let swapCell;
        if(checkCorners) {
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
        }
        if(!swapCell) {
            //none of the corners are viable swaps, swap bomb with random viable (safe) cell
            /* undefined cell prevented by assumptions that:
                    a.) there are > 1 safe cells in the game,
                    b.) and that this segment only runs if isFirstClick)
             */
            let viableCells = gameBoard.filter(c => !c.isBomb && c.id !== clickedCell.id && !c.isRevealed);
            let cellId = Math.floor(Math.random() * viableCells.length);
            swapCell = viableCells[cellId];
        }
        gameBoard = this.swapCells(gameBoard, clickedCell, swapCell);
        return gameBoard;
    }


    isCorner(cell: MineSweeperCell, config?: GameConfig) {
        if(!config) config = this.getGameboardDimensions();
        // [topLeft, topRight, bottomRight, bottomLeft]
        const cornerIds = [
            0,
            config.cellsPerRow - 1,
            this.gameCells.length - 1,
            this.gameCells.length - config.cellsPerRow
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
    }


    // ===== end game functions =====
    checkGameOver(cell: MineSweeperCell): boolean {
        //check for loss
        if(cell.isBomb && !cell.isFlagged) {
            this.displayGameLost(cell);
            return true;
        } else if(!cell.isBomb && this.checkForGameWin()) {
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
        // this.revealBombs3(cell);
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
        // var heap = this.revealBombs2(cell).clone();
        // heap.heapify();
        var heap = this.revealBombs3(cell);
        let i = 0;
        let delay = this.cascadeAnimationDuration;
        let interval = 50;

        // while(!heap.isEmpty()) {
        while(heap.length > 0) {
            const c = heap.pop();
            i += 1;
            if( c && c.isBomb && !c.isFlagged ) {
                this.revealCell(c, delay + (interval * i));
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
            neighbors = Object.values(this.getCellNeighbors(this.gameCells, node, this.gameConfig))
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

    revealBombs3(startCell: MineSweeperCell): any[] {
        this.reInitCellIdsAndLocation(this.gameCells);
        return this.gameCells.filter(c => c.isBomb && !c.isFlagged)
            .sort((a, b) => {
                let distToA = this.distanceBetweenCells(startCell, a);
                let distToB = this.distanceBetweenCells(startCell, b);
                return distToB - distToA;
            });
    }
    checkForGameWin(): boolean {
        return this.numSafeCellsRevealed === this.gameCells.length - this.NUM_BOMBS[this.GAME_DIFFICULTY];
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

    getCellNeighbors(allCells: MineSweeperCell[], cell: MineSweeperCell, config?: GameConfig) {
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
    getCellAt(x: number, y: number): any {
        const index = (this.gameConfig.cellsPerRow * y) + x;
        return this.gameCells[index];
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

        const x = index > this.gameConfig.cellsPerRow
            ? index % this.gameConfig.cellsPerRow
            : index;
        const y = index > 0 ? Math.floor(index / this.gameConfig.cellsPerRow) : 0;

        return {
            x: x,
            y: y
        };
    }

    revealCell(cell: any, delay?: number) {
        if(!delay) delay = 0;
        const { id } = cell;
        setTimeout(() => {
            this.gameCells[id].isRevealed = true;
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

    distanceBetweenCells(cellA: MineSweeperCell, cellB: MineSweeperCell): number {
        let coordsA = this.getCellCoords({cell: cellA});
        let coordsB = this.getCellCoords({cell: cellB});

        let x = coordsA.x - coordsB.x;
        let y = coordsA.y - coordsB.y;
        return Math.sqrt((x * x) + (y * y));
    }
}
