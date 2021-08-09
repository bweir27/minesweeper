export type MineSweeperCell = {
    id: number,
    isRevealed: boolean,
    isBomb: boolean,
    isFlagged: boolean,
    neighborBombs: number,
};
