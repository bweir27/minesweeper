import { MineSweeperCell } from '../../components/types/minesweeper/cell';
import { GameConfig } from './GameConfig';

export function getCellNorthOf(allCells: MineSweeperCell[], cell: MineSweeperCell, config: GameConfig): any {
    if (!cell) return undefined;
    const isTopEdge = cell.id < config.cellsPerRow;
    return !isTopEdge ? allCells[cell.id - config.cellsPerRow] : undefined;
}

export function getCellSouthOf(allCells: MineSweeperCell[], cell: MineSweeperCell, config: GameConfig): any {
    if (!cell) return undefined;
    const isBottomEdge = cell.id > allCells.length - config.cellsPerRow;
    return !isBottomEdge ? allCells[cell.id + config.cellsPerRow] : undefined;
}

export function getCellEastOf(allCells: MineSweeperCell[], cell: MineSweeperCell, config: GameConfig): any {
    if (!cell) return undefined;
    const isRightEdge = cell.id % config.cellsPerRow === config.cellsPerRow - 1;
    return !isRightEdge ? allCells[cell.id + 1] : undefined;
}

export function getCellWestOf(allCells: MineSweeperCell[], cell: MineSweeperCell, config: GameConfig): any {
    if (!cell) return undefined;
    const isLeftEdge = (cell.id > 0 && cell.id % config.cellsPerRow === 0);
    return !isLeftEdge
        ? allCells[cell.id - 1] : undefined;
}


export default {
    getCellNorthOf,
    getCellSouthOf,
    getCellEastOf,
    getCellWestOf
};
