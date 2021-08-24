export type MineSweeperCell = {
    id: number,
    isRevealed: boolean,
    isBomb: boolean,
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
    isBomb: false,
    isFlagged: false,
    neighborBombs: 0,
    passedOver: false,
    passedNum: 0,
};
