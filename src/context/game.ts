import { Context } from "./types";
import { getStageName, getStageShortName } from "../melee/stages";
import { GameStartType, GameEndType, GameEndMethod } from "../types";
import { getCharacterName, getCharacterShortName, getCharacterColorName } from "../melee/characters";

export const generateGameStartContext = (gameStart: GameStartType, context?: Context, index?: number): Context => {
  const numPlayers = gameStart.players.length;
  let ctx: Context = {
    numPlayers,
  };
  const stageId = gameStart.stageId;
  if (stageId) {
    ctx.stage = getStageName(stageId);
    ctx.shortStage = getStageShortName(stageId);
  }
  ctx = genPlayerOpponentContext(gameStart, ctx, index);
  return Object.assign(ctx, context);
};

export const generateGameEndContext = (gameEnd: GameEndType, context?: Context): Context => {
  const ctx: Context = {};
  if (gameEnd.lrasInitiatorIndex !== null) {
    ctx.quitterPort = getQuitterPort(gameEnd.lrasInitiatorIndex);
  }
  if (gameEnd.gameEndMethod !== null) {
    ctx.endMethod = getGameEndMethod(gameEnd.gameEndMethod);
  }
  return Object.assign(ctx, context);
};

const getQuitterPort = (index: number): number => {
  if (index === -1) {
    return -1;
  }
  return index + 1;
};

const getGameEndMethod = (method: GameEndMethod): string => {
  switch (method) {
  case GameEndMethod.GAME:
    return "Game";
  case GameEndMethod.TIME:
    return "Time";
  case GameEndMethod.NO_CONTEST:
    return "No contest";
  default:
    return "Unknown";
  }
};

const genPlayerOpponentContext = (gameStart: GameStartType, context?: Context, index?: number): Context => {
  const numPlayers = gameStart.players.length;
  const ctx: Context = {};
  if (numPlayers === 2) {
    const playerIndex = index !== undefined ? index : gameStart.players[0].playerIndex;
    let opponentIndex = gameStart.players.map(p => p.playerIndex).find((i) => i !== playerIndex);
    if (opponentIndex === undefined) {
      opponentIndex = gameStart.players[1].playerIndex;
    }
    const playerContext = genPlayerContext(playerIndex, gameStart);
    const opponentContext = genPlayerContext(opponentIndex, gameStart);
    if (playerContext !== null) {
      ctx.player = `P${playerContext.port}`;
      ctx.playerTag = playerContext.tag;
      ctx.playerPort = playerContext.port;
      ctx.playerChar = playerContext.char;
      ctx.playerShortChar = playerContext.shortChar;
      ctx.playerColor = playerContext.color;
    }
    if (opponentContext !== null) {
      ctx.opponent = `P${opponentContext.port}`;
      ctx.opponentTag = opponentContext.tag;
      ctx.opponentPort = opponentContext.port;
      ctx.opponentChar = opponentContext.char;
      ctx.opponentShortChar = opponentContext.shortChar;
      ctx.opponentColor = opponentContext.color;
    }
  }
  return Object.assign(ctx, context);
};

interface PlayerContext {
  tag: string | null;
  port: number;
  char: string;
  shortChar: string;
  color: string;
}

const genPlayerContext = (index: number, settings: GameStartType): PlayerContext | null => {
  const player = settings.players.find(p => p.playerIndex === index);
  if (!player) {
    // throw new Error(`Could not find player with index: ${index}`);
    return null;
  }

  const playerCharId = player.characterId;
  const playerCharColor = player.characterColor;
  if (playerCharId !== null && playerCharColor !== null) {
    return {
      tag: player.nametag,
      port: player.port,
      char: getCharacterName(playerCharId),
      shortChar: getCharacterShortName(playerCharId),
      color: getCharacterColorName(playerCharId, playerCharColor),
    };
  }
  return null;
};
