// export enum CellState {
//     FlAGGED, // cell is flagged
//     HIDDEN, // cell is untouched
//     REVEALED, // cell has been revealed / clicked
// }

export type MineSweeperCell = {
    id: number,
    isRevealed: boolean
    isFlagged: boolean,
    neighborBombs: number,
    passedOver: boolean // used for recursion base case
    passedNum: number,
    x?: number,
    y?: number
};

export const defaultCell: MineSweeperCell = {
    id: 0,
    isRevealed: false,
    isFlagged: false,
    neighborBombs: 0,
    passedOver: false,
    passedNum: 0,
};

export type CellNeighbors = {
    north: MineSweeperCell,
    south: MineSweeperCell,
    east: MineSweeperCell,
    west: MineSweeperCell,
    northeast: MineSweeperCell,
    southeast: MineSweeperCell,
    southwest: MineSweeperCell,
    northwest: MineSweeperCell
};
