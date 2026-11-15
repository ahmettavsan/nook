import { layoutRooms, moveRoom } from './arrange';
import { CARD_H, CARD_W, GAP, HEAD, PAD } from './constants';
import { roomOf } from './geometry';
import { stackMap } from './stacks';
import type { Board } from './types';

/** Positions and sizes only; used to undo a layout change. */
export interface LayoutSnapshot {
  g: Map<string, { x: number; y: number; w: number; h: number }>;
  i: Map<string, { x: number; y: number }>;
}

export function layoutSnapshot(board: Board): LayoutSnapshot {
  return {
    g: new Map(Object.entries(board.groups).map(([id, g]) => [id, { x: g.x, y: g.y, w: g.w, h: g.h }])),
    i: new Map(Object.entries(board.items).map(([id, it]) => [id, { x: it.x, y: it.y }])),
  };
}

export function restoreLayout(board: Board, snap: LayoutSnapshot): void {
  for (const [id, o] of snap.g) if (board.groups[id]) Object.assign(board.groups[id], o);
  for (const [id, o] of snap.i) if (board.items[id]) Object.assign(board.items[id], o);
}

/**
 * Lays rooms out in columns (each keeps its own number of card columns; its cards stay in its grid)
 * and puts the loose cards to the right.
 */
export function tidy(board: Board): void {
  layoutRooms(board);
  const loose: string[] = [];
  const sm = stackMap(board);
  for (const [id, it] of Object.entries(board.items)) {
    if (it.stack && sm.has(it.stack) && sm.get(it.stack)![0] !== id) continue;
    if (!roomOf(board, it)) loose.push(id);
  }
  const byPos = (a: { x: number; y: number }, b: { x: number; y: number }) => a.y - b.y || a.x - b.x;
  const rooms = Object.entries(board.groups).sort((a, b) => byPos(a[1], b[1]));
  const ROOM_SPACE = 72;
  const nCols = rooms.length <= 1 ? 1 : rooms.length <= 4 ? 2 : 3;
  const colY = new Array<number>(nCols).fill(0);
  const colW = new Array<number>(nCols).fill(0);
  const place = new Map<string, { c: number; y: number }>();
  for (const [gid, g] of rooms) {
    let c = 0;
    for (let k = 1; k < nCols; k++) if (colY[k] < colY[c]) c = k;
    place.set(gid, { c, y: colY[c] });
    colY[c] += g.h + ROOM_SPACE;
    colW[c] = Math.max(colW[c], g.w);
  }
  const colX = colW.map((_, c) => colW.slice(0, c).reduce((sum, w) => sum + w + ROOM_SPACE, 0));
  for (const [gid, g] of rooms) {
    const { c, y } = place.get(gid)!;
    moveRoom(board, gid, colX[c] - g.x, y - g.y);
  }
  if (loose.length) {
    loose.sort((a, b) => byPos(board.items[a], board.items[b]));
    const x0 = rooms.length ? colX[nCols - 1] + colW[nCols - 1] + ROOM_SPACE : 0;
    const cols = rooms.length ? 2 : Math.max(3, Math.ceil(Math.sqrt(loose.length)));
    const y0 = rooms.length ? HEAD + PAD : 0;
    loose.forEach((id, j) => {
      const it = board.items[id];
      it.x = x0 + (j % cols) * (CARD_W + GAP);
      it.y = y0 + Math.floor(j / cols) * (CARD_H + GAP);
    });
  }
  for (const ids of sm.values()) {
    const f = board.items[ids[0]];
    for (const i of ids) {
      board.items[i].x = f.x;
      board.items[i].y = f.y;
    }
  }
}
