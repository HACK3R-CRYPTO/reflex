// TODO: Nash Equilibrium strategy engine
// Returns a provably random, fair move for each game type

export enum GameType {
  RockPaperScissors = 0,
  DiceRoll = 1,
  StrategyBattle = 2,
  CoinFlip = 3,
}

export function getNashMove(gameType: GameType): number {
  // TODO: implement Nash Equilibrium strategy per game type
  return 0;
}
