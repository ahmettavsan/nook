import { CARD_H, CARD_W, GAP, HEAD, MAX_COLS, PAD, ROOM_GAP } from './constants';
import { stackMap } from './stacks';
import type { Board, Group } from './types';

/*
 * Rooms are sized by their cards. Inside a room the cards sit in a grid of `cols` columns, in reading
 * order; the room is exactly as big as that grid (one empty row when it has no cards). Rooms never
 * overlap: one that moves or grows into another pushes it away, keeping `ROOM_GAP` between them.
 *
 * Like the rest of the domain, these functions mutate the board and are meant to run inside an Immer
 * recipe; `updateBoard` (store/appStore.ts) runs `arrange` after every change.
 */

const STEP_X = CARD_W + GAP;
const STEP_Y = CARD_H + GAP;

export const roomWidth = (cols: number) => PAD * 2 + cols * CARD_W + (cols - 1) * GAP;
const roomHeight = (rows: number) => HEAD + PAD * 2 + rows * CARD_H + (rows - 1) * GAP;

/** Columns for a room drawn or resized to width `w`. */
export const colsForWidth = (w: number) =>
  Math.min(MAX_COLS, Math.max(1, Math.round((w - PAD * 2 + GAP) / STEP_X)));

/** Top-left corner of the grid slot `i` of a room. */
const slot = (g: Group, i: number) => ({
  x: g.x + PAD + (i % g.cols) * STEP_X,
  y: g.y + HEAD + PAD + Math.floor(i / g.cols) * STEP_Y,
});

/** A point below every card of the room: a card put there becomes its last one. */
export const endOfRoom = (g: Group) => ({ x: g.x + PAD, y: g.y + g.h + STEP_Y });

/**
 * Puts every room's cards in its grid and sizes the room to fit. The order is the cards' reading order
 * (row by row, left to right), so a card dropped between two others lands between them. Cards being
 * dragged (`held`) are left out until they are dropped, unless their whole room is being dragged.
 */
export function layoutRooms(board: Board, held?: ReadonlySet<string> | null): void {
  const sm = stackMap(board);
  const members = new Map<string, string[]>();
  for (const [id, it] of Object.entries(board.items)) {
    const g = board.groups[it.room];
    if (!g) continue;
    // Alternatives sit on their front card; only the front card takes a slot.
    if (it.stack && sm.has(it.stack) && sm.get(it.stack)![0] !== id) continue;
    if (held?.has(id) && !held.has(it.room)) continue;
    const list = members.get(it.room);
    if (list) list.push(id);
    else members.set(it.room, [id]);
  }

  for (const [gid, g] of Object.entries(board.groups)) {
    const ids = members.get(gid) || [];
    const row = (y: number) => Math.max(0, Math.round((y - g.y - HEAD - PAD) / STEP_Y));
    ids.sort((a, b) => {
      const p = board.items[a];
      const q = board.items[b];
      return row(p.y) - row(q.y) || p.x - q.x || (a < b ? -1 : 1);
    });
    ids.forEach((id, i) => {
      const { x, y } = slot(g, i);
      const it = board.items[id];
      const stack = it.stack && sm.get(it.stack);
      for (const m of stack || [id]) {
        const card = board.items[m];
        if (card.x !== x) card.x = x;
        if (card.y !== y) card.y = y;
      }
    });
    const w = roomWidth(g.cols);
    const h = roomHeight(Math.max(1, Math.ceil(ids.length / g.cols)));
    if (g.w !== w) g.w = w;
    if (g.h !== h) g.h = h;
  }
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The two rooms are closer than `ROOM_GAP` (or overlap). */
const tooClose = (a: Box, b: Box) =>
  a.x < b.x + b.w + ROOM_GAP &&
  a.x + a.w + ROOM_GAP > b.x &&
  a.y < b.y + b.h + ROOM_GAP &&
  a.y + a.h + ROOM_GAP > b.y;

/** Moves a room with its cards (but not the cards being dragged). */
export function moveRoom(
  board: Board,
  gid: string,
  dx: number,
  dy: number,
  held?: ReadonlySet<string> | null,
): void {
  const g = board.groups[gid];
  g.x += dx;
  g.y += dy;
  for (const [id, it] of Object.entries(board.items)) {
    if (it.room !== gid || held?.has(id)) continue;
    it.x += dx;
    it.y += dy;
  }
}

/** Moves the room the shortest way out of the fixed rooms, preferring a spot clear of all of them. */
function pushOut(board: Board, gid: string, fixed: Box[], held?: ReadonlySet<string> | null): void {
  const g = board.groups[gid];
  for (let tries = 0; tries < 8; tries++) {
    const hits = fixed.filter((f) => tooClose(g, f));
    if (!hits.length) return;
    const moves = hits.flatMap((f) => [
      { dx: f.x + f.w + ROOM_GAP - g.x, dy: 0 },
      { dx: f.x - ROOM_GAP - (g.x + g.w), dy: 0 },
      { dx: 0, dy: f.y + f.h + ROOM_GAP - g.y },
      { dx: 0, dy: f.y - ROOM_GAP - (g.y + g.h) },
    ]);
    moves.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
    const clearOfAll = moves.find((m) =>
      fixed.every((f) => !tooClose({ x: g.x + m.dx, y: g.y + m.dy, w: g.w, h: g.h }, f)),
    );
    const m = clearOfAll || moves[0];
    moveRoom(board, gid, Math.round(m.dx), Math.round(m.dy), held);
    if (clearOfAll) return;
  }
}

/**
 * Pushes rooms apart so none overlaps another. `first` lists the rooms that stay put (the one being
 * dragged, or the ones that just changed); every other room is visited from the nearest outwards and
 * moved out of the rooms already settled, so a push can travel on to the next room. Rooms that do
 * not touch anything never move.
 */
export function separateRooms(board: Board, first: string[], held?: ReadonlySet<string> | null): void {
  const ids = Object.keys(board.groups);
  if (ids.length < 2) return;
  const lead = first.filter((id) => board.groups[id]);
  const center = (id: string) => {
    const g = board.groups[id];
    return { x: g.x + g.w / 2, y: g.y + g.h / 2 };
  };
  const anchors = (
    lead.length
      ? lead
      : [
          ids.sort(
            (a, b) => board.groups[a].y - board.groups[b].y || board.groups[a].x - board.groups[b].x,
          )[0],
        ]
  ).map(center);
  const dist = (id: string) => {
    const c = center(id);
    return Math.min(...anchors.map((a) => Math.hypot(a.x - c.x, a.y - c.y)));
  };
  const rest = ids.filter((id) => !lead.includes(id)).sort((a, b) => dist(a) - dist(b));
  const settled: Box[] = [];
  for (const id of [...lead, ...rest]) {
    pushOut(board, id, settled, held);
    settled.push(board.groups[id]);
  }
}

/** Rooms that are new or changed position or size since `prev`. */
function changedRooms(prev: Board, board: Board): string[] {
  return Object.entries(board.groups)
    .filter(([id, g]) => {
      const p = prev.groups[id];
      return !p || p.x !== g.x || p.y !== g.y || p.w !== g.w || p.h !== g.h;
    })
    .map(([id]) => id);
}

/**
 * Brings the board back to its rules after a change: cards in their rooms' grids, rooms sized to their
 * cards and apart from each other. `root` is a room that must stay where it is (the one being dragged
 * or resized); otherwise the rooms that changed stay and the others make way.
 */
export function arrange(board: Board, prev: Board, held?: ReadonlySet<string> | null, root?: string): void {
  layoutRooms(board, held);
  const first = root ? [root] : changedRooms(prev, board);
  if (first.length) separateRooms(board, first, held);
}
