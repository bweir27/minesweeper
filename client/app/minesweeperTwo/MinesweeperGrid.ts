import {GameConfig} from './GameConfig';
import {CellNeighbors, defaultCell, MineSweeperCell} from './MinesweeperCell';
import { shuffle } from '../../components/util';

export class MinesweeperGrid extends Object {
    gameConfig: GameConfig;
    minePositions: Set<number> = new Set();
    cells: MineSweeperCell[] = [];
    gameOver = false;

    public init(config: GameConfig) {
        if(!config) throw new Error('no gameConfig!');
        this.gameConfig = config;
        this.minePositions.clear();
        this.cells = Array(this.getNumCells() - 1)
            .fill({...defaultCell})
            .map((c, index) => ({...c, id: index}));
        this.gameOver = false;
        this.placeMines();
        console.log(this.cells);
    }

    public getNumCells(): number {
        return this.gameConfig.cellsPerRow * this.gameConfig.numRows;
    }

    public isCell(cellPos: number): boolean {
        return !!this.cells[cellPos];
    }

    public isMine(cellPos: number): boolean {
        return this.minePositions.has(cellPos);
    }

    public getCell(cellPos: number): any {
        return this.cells[cellPos];
    }

    public revealCell(cellPos: number): boolean {
        if(!this.isCell(cellPos) || this.cells[cellPos].isRevealed || this.cells[cellPos].isFlagged) {
            return false;
        }

        this.cells[cellPos].isRevealed = true;

        if(this.minePositions.has(cellPos)) {
            this.gameOver = true;
        }
        return true;
    }

    public toggleFlag(cellPos: number): boolean {
        if(this.isCell[cellPos] && !this.cells[cellPos].isRevealed) {
            this.cells[cellPos].isFlagged = !this.cells[cellPos].isFlagged;
            return true;
        }
        return false;
    }

    public setMineAt(cellPos: number): boolean {
        if (this.minePositions.has(cellPos)) return false;
        this.minePositions.add(cellPos);

        return true;
    }

    public isGameOver() {
        if(this.isGameWin()) {
            this.gameOver = true;
        }
        return this.gameOver;
    }

    public isGameWin(): boolean {
        //TODO: implement this
        return false;
    }

    public placeMines() {
        let arr: number[] = [];
        arr[this.gameConfig.numRows * this.gameConfig.cellsPerRow] = 1;
        shuffle(Array.from(Array(this.gameConfig.numRows * this.gameConfig.cellsPerRow).keys()))
            .slice(0, this.gameConfig.numBombs - 1)
            .forEach(p => this.setMineAt(p));
    }

    public getCellNeighbors(cell: MineSweeperCell): CellNeighbors {
        return {
            north: this.getCellNorthOf(cell.id),
            south: this.getCellSouthOf(cell.id),
            east: this.getCellEastOf(cell.id),
            west: this.getCellWestOf(cell.id),
            northeast: this.getCellEastOf(this.getCellNorthOf(cell.id).id),
            southeast: this.getCellEastOf(this.getCellSouthOf(cell.id).id),
            southwest: this.getCellWestOf(this.getCellSouthOf(cell.id).id),
            northwest: this.getCellWestOf(this.getCellNorthOf(cell.id).id)
        };
    }

    public getCellNorthOf(cellPos: number): MineSweeperCell {
        if (!cellPos) return undefined;
        const isTopEdge = cellPos < this.gameConfig.cellsPerRow;
        return !isTopEdge ? this.cells[cellPos - this.gameConfig.cellsPerRow] : undefined;
    }

    public getCellSouthOf(cellPos: number): MineSweeperCell {
        if (!this.isCell(cellPos) || !this.gameConfig) return undefined;
        const isBottomEdge = cellPos > this.cells.length - this.gameConfig.cellsPerRow;
        return !isBottomEdge ? this.cells[cellPos + this.gameConfig.cellsPerRow] : undefined;
    }

    public getCellEastOf(cellPos: number): MineSweeperCell {
        if (!this.isCell(cellPos) || !this.gameConfig) return undefined;
        const isRightEdge = cellPos % this.gameConfig.cellsPerRow === this.gameConfig.cellsPerRow - 1;
        return !isRightEdge ? this.cells[cellPos + 1] : undefined;
    }

    public getCellWestOf(cellPos: number): MineSweeperCell {
        if (!this.isCell(cellPos) || !this.gameConfig) return undefined;
        const isLeftEdge = (cellPos > 0 && cellPos % this.gameConfig.cellsPerRow === 0);
        return !isLeftEdge ? this.cells[cellPos - 1] : undefined;
    }


    public initNeighborBombCount(cells: MineSweeperCell[], includeSelf?: boolean): MineSweeperCell[] {
        let board = [...cells];
        let bombs = board.filter(c => this.isMine(c.id));
        bombs.forEach((b) => {
            let neighbors = this.getCellNeighbors(b);
            let keys = Object.values(neighbors);
            keys.forEach(({ id }) => {
                if(id && id && !this.isMine(id)) this.cells[id].neighborBombs += 1;
            });
        });
        return board;
    }


    constructor(props: Object = {}) {
        super(props);
        Object.assign(this, {...props});
    }

}
