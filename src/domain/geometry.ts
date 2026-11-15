import { CARD_H, CARD_W, MIN_GAP, STACK_OFFSETS } from './constants';
import { stackMap } from './stacks';
import type { Board, Clip, Item } from './types';

/*
 * Functions that take a `Board` and return nothing (or a flag) mutate it in place.
 * They are meant to run inside an Immer recipe (see `updateBoard` in store/appStore.ts).
 */

const anchorInside = (it: Pick<Item, 'x' | 'y'>, g: Board['groups'][string]): boolean => {
  const cx = it.x + CARD_W / 2;
  const cy = it.y + 40;
  return cx >= g.x && cx <= g.x + g.w && cy >= g.y && cy <= g.y + g.h;
};

/**
 * The smallest room under the card's anchor point, or null. This is only where the card is drawn;
 * which room it belongs to is `item.room`.
 */
export function roomAt(board: Board, it: Pick<Item, 'x' | 'y'>): string | null {
  let best: string | null = null;
  let area = Infinity;
  for (const [id, g] of Object.entries(board.groups)) {
    if (anchorInside(it, g)) {
      const a = g.w * g.h;
      if (a < area) {
        area = a;
        best = id;
      }
    }
  }
  return best;
}

/** The cards that belong to the room. */
export function membersOf(board: Board, gid: string): string[] {
  return Object.keys(board.items).filter((id) => board.items[id].room === gid);
}

/** The room a card belongs to, when that room still exists. */
export const roomOf = (board: Board, it: Pick<Item, 'room'>): string | null =>
  it.room && board.groups[it.room] ? it.room : null;

/** A card (or stack, `ids`) the user put down joins the room it was put in, or none. */
export function assignRoom(board: Board, ids: Iterable<string>, leadId: string): void {
  const lead = board.items[leadId];
  if (!lead) return;
  const gid = roomAt(board, lead) || '';
  for (const i of ids) if (board.items[i]) board.items[i].room = gid;
}

/**
 * Cards without a room that now lie inside the room join it (after the room was drawn, moved or grown
 * around them). Cards of another room are never taken.
 */
export function adoptLooseCards(board: Board, gid: string): void {
  const g = board.groups[gid];
  if (!g) return;
  for (const it of Object.values(board.items)) if (!roomOf(board, it) && anchorInside(it, g)) it.room = gid;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where each card is drawn. Alternatives peek out behind their front card; hidden ones are left out. */
export function cardBoxes(board: Board): Map<string, Box> {
  const out = new Map<string, Box>();
  const sm = stackMap(board);
  for (const ids of sm.values()) {
    const f = board.items[ids[0]];
    ids.forEach((i, d) => {
      if (d > 2) return;
      const off = STACK_OFFSETS[d];
      out.set(i, { x: f.x + off, y: f.y - off, w: CARD_W, h: CARD_H });
    });
  }
  for (const [id, it] of Object.entries(board.items)) {
    if (!(it.stack && sm.has(it.stack))) {
      out.set(id, { x: it.x, y: it.y, w: CARD_W, h: CARD_H });
    }
  }
  return out;
}

/** True when the two boxes are at least `MIN_GAP` apart. */
const clear = (a: Box, b: Box) =>
  a.x >= b.x + b.w + MIN_GAP ||
  a.x + a.w + MIN_GAP <= b.x ||
  a.y >= b.y + b.h + MIN_GAP ||
  a.y + a.h + MIN_GAP <= b.y;

/**
 * Puts a card dropped or created outside rooms where it does not touch any other card: it keeps its
 * spot when that is already clear, otherwise it moves to the nearest position at least `MIN_GAP` away
 * from every other card. (Cards in rooms sit in the room's grid instead, see domain/arrange.ts.)
 * `ids` move together (a whole stack); `pid` is the lead card. Returns true when the cards were moved.
 */
export function settleCard(board: Board, ids: Iterable<string>, pid: string): boolean {
  const it = board.items[pid];
  if (!it) return false;
  const moving = new Set(ids);
  const boxes = cardBoxes(board);

  // Footprint of the moving cards (a stack peeks out up and to the right), relative to the lead card.
  const parts = [...moving]
    .map((i) => boxes.get(i))
    .filter((b): b is Box => !!b)
    .map((b) => ({ dx: b.x - it.x, dy: b.y - it.y }));
  if (!parts.length) parts.push({ dx: 0, dy: 0 });
  const obstacles = [...boxes].filter(([i]) => !moving.has(i)).map(([, b]) => b);

  const want = { x: Math.round(it.x), y: Math.round(it.y) };

  const fits = (x: number, y: number) =>
    parts.every((p) => {
      const box = { x: x + p.dx, y: y + p.dy, w: CARD_W, h: CARD_H };
      return obstacles.every((o) => clear(box, o));
    });

  let best = want;
  if (!fits(want.x, want.y)) {
    // The nearest clear spot lines up with an edge of some card (plus the gap) on at least one axis,
    // so those edges and the wanted position are the only candidates worth testing.
    const xs = new Set([want.x]);
    const ys = new Set([want.y]);
    for (const o of obstacles) {
      for (const p of parts) {
        xs.add(Math.ceil(o.x + o.w + MIN_GAP - p.dx));
        xs.add(Math.floor(o.x - CARD_W - MIN_GAP - p.dx));
        ys.add(Math.ceil(o.y + o.h + MIN_GAP - p.dy));
        ys.add(Math.floor(o.y - CARD_H - MIN_GAP - p.dy));
      }
    }
    const candidates: { x: number; y: number; d: number }[] = [];
    for (const x of xs) {
      for (const y of ys) {
        candidates.push({ x, y, d: Math.hypot(x - want.x, y - want.y) });
      }
    }
    candidates.sort((a, b) => a.d - b.d);
    best = candidates.find((c) => fits(c.x, c.y)) || want;
  }

  const dx = best.x - it.x;
  const dy = best.y - it.y;
  if (dx || dy) {
    for (const i of moving) {
      const o = board.items[i];
      if (o) {
        o.x += dx;
        o.y += dy;
      }
    }
  }
  return !!(dx || dy);
}

/** Axis-aligned box around a (possibly rotated) clip. */
export function clipBounds(c: Clip): Bounds {
  const a = (c.rot * Math.PI) / 180;
  const hw = (Math.abs(c.w * Math.cos(a)) + Math.abs(c.h * Math.sin(a))) / 2;
  const hh = (Math.abs(c.w * Math.sin(a)) + Math.abs(c.h * Math.cos(a))) / 2;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  return { x1: cx - hw, y1: cy - hh, x2: cx + hw, y2: cy + hh };
}

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function bounds(board: Board): Bounds | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const g of Object.values(board.groups)) {
    x1 = Math.min(x1, g.x);
    y1 = Math.min(y1, g.y);
    x2 = Math.max(x2, g.x + g.w);
    y2 = Math.max(y2, g.y + g.h);
  }
  for (const it of Object.values(board.items)) {
    x1 = Math.min(x1, it.x);
    y1 = Math.min(y1, it.y);
    x2 = Math.max(x2, it.x + CARD_W);
    y2 = Math.max(y2, it.y + CARD_H);
  }
  for (const c of Object.values(board.clips)) {
    const b = clipBounds(c);
    x1 = Math.min(x1, b.x1);
    y1 = Math.min(y1, b.y1);
    x2 = Math.max(x2, b.x2);
    y2 = Math.max(y2, b.y2);
  }
  return isFinite(x1) ? { x1, y1, x2, y2 } : null;
}
