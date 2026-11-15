import { produce } from 'immer';
import { describe, expect, it } from 'vitest';
import {
  addAlternative,
  createGroup,
  createItem,
  deleteGroup,
  deleteItem,
  detachFromStack,
  emptyBoard,
  moveToRoom,
} from './board';
import { CARD_H, CARD_W, GAP, HEAD, MIN_GAP, PAD, ROOM_GAP } from './constants';
import { parseNum, total } from './format';
import { arrange, endOfRoom, layoutRooms, roomWidth } from './arrange';
import {
  adoptLooseCards,
  assignRoom,
  bounds,
  cardBoxes,
  clipBounds,
  membersOf,
  roomAt,
  roomOf,
} from './geometry';
import { layoutSnapshot, restoreLayout, tidy } from './layout';
import { buildTemplate } from './template';
import { bringFront, cycleStack, joinStack, reps, stackMap } from './stacks';
import { boardStats, matches } from './stats';
import type { Board } from './types';

const boardWith = (fn: (b: Board) => void) => produce(emptyBoard(), fn);

describe('format', () => {
  it('parses Turkish formatted numbers', () => {
    expect(parseNum('1.500')).toBe(1500);
    expect(parseNum('1.500,50')).toBe(1500.5);
    expect(parseNum('₺ 32.000')).toBe(32000);
    expect(parseNum('')).toBe(0);
  });

  it('multiplies price by quantity, treating a missing quantity as 1', () => {
    expect(total({ price: 1750, qty: 4 })).toBe(7000);
    expect(total({ price: 100, qty: 0 })).toBe(100);
  });
});

describe('geometry', () => {
  it('assigns a card to the smallest room containing it', () => {
    let small = '';
    const b = boardWith((d) => {
      createGroup(d, 0, 0, 2000, 2000, 'Ev');
      small = createGroup(d, 100, 100, 600, 400, 'Salon');
    });
    expect(roomAt(b, { x: 150, y: 250 })).toBe(small);
    expect(roomAt(b, { x: 5000, y: 5000 })).toBeNull();
  });

  it('keeps cards apart outside rooms too', () => {
    let a = '';
    let c = '';
    const b = boardWith((d) => {
      a = createItem(d, 1000, 1000);
      c = createItem(d, 1000 + CARD_W - 40, 1010); // overlapping the right side of `a`
    });
    expect(b.items[a]).toMatchObject({ x: 1000, y: 1000 });
    expect(b.items[c]).toMatchObject({ x: 1000 + CARD_W + MIN_GAP, y: 1010 });
  });

  it('pushes a card that only touches another one out to the minimum gap', () => {
    let c = '';
    const b = boardWith((d) => {
      createItem(d, 0, 0);
      c = createItem(d, CARD_W + 4, 0);
    });
    expect(b.items[c].x).toBe(CARD_W + MIN_GAP);
  });

  it('leaves a card alone when it already has room around it', () => {
    let c = '';
    const b = boardWith((d) => {
      createItem(d, 0, 0);
      c = createItem(d, CARD_W + MIN_GAP + 5, 7);
    });
    expect(b.items[c]).toMatchObject({ x: CARD_W + MIN_GAP + 5, y: 7 });
  });

  it('keeps clear of the alternatives peeking out behind a stack', () => {
    let front = '';
    let c = '';
    const b = boardWith((d) => {
      front = createItem(d, 0, 0);
      addAlternative(d, front); // the old front card now peeks out 24px to the right
      c = createItem(d, CARD_W + MIN_GAP, 0);
    });
    const boxes = [...cardBoxes(b)].filter(([id]) => id !== c).map(([, box]) => box);
    const right = Math.max(...boxes.map((x) => x.x + x.w));
    expect(b.items[c].x).toBeGreaterThanOrEqual(right + MIN_GAP);
  });

  it('never leaves two loose cards overlapping after a drop', () => {
    const ids: string[] = [];
    const b = boardWith((d) => {
      for (let i = 0; i < 8; i++) ids.push(createItem(d, 500 + i * 24, 500 + i * 24));
    });
    for (const i of ids) {
      for (const j of ids) {
        if (i >= j) continue;
        const p = b.items[i];
        const q = b.items[j];
        const apart =
          p.x >= q.x + CARD_W + MIN_GAP ||
          q.x >= p.x + CARD_W + MIN_GAP ||
          p.y >= q.y + CARD_H + MIN_GAP ||
          q.y >= p.y + CARD_H + MIN_GAP;
        expect(apart).toBe(true);
      }
    }
  });
});

describe('cut-outs', () => {
  it('count toward the board bounds, rotation included', () => {
    const b = boardWith((d) => {
      d.clips.c = { img: '', x: 0, y: 0, w: 200, h: 100, rot: 90, z: 1 };
    });
    const round = (o: object) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
    expect(round(clipBounds(b.clips.c))).toEqual({ x1: 50, y1: -50, x2: 150, y2: 150 });
    expect(round(bounds(b)!)).toEqual({ x1: 50, y1: -50, x2: 150, y2: 150 });
  });
});

describe('room membership', () => {
  /** Two rooms side by side with one card each. */
  const twoRooms = () => {
    const ids = { a: '', b: '', cardA: '', cardB: '' };
    const board = boardWith((d) => {
      ids.a = createGroup(d, 0, 0, 700, 500);
      ids.b = createGroup(d, 1000, 0, 700, 500);
      ids.cardA = createItem(d, PAD, HEAD + PAD);
      ids.cardB = createItem(d, 1000 + PAD, HEAD + PAD);
    });
    return { board, ...ids };
  };

  it('gives a new card the room it was created in', () => {
    const { board, a, b, cardA, cardB } = twoRooms();
    expect(board.items[cardA].room).toBe(a);
    expect(board.items[cardB].room).toBe(b);
  });

  it('does not take the cards of a room another room is moved over', () => {
    const { board, a, b, cardA, cardB } = twoRooms();
    const moved = produce(board, (d) => {
      // What dragging room B onto room A does: B and its own cards move, then loose cards are adopted.
      for (const id of membersOf(d, b)) d.items[id].x -= 1000;
      d.groups[b].x = 0;
      adoptLooseCards(d, b);
    });
    expect(moved.items[cardA].room).toBe(a);
    expect(moved.items[cardB].room).toBe(b);
    expect(membersOf(moved, b)).toEqual([cardB]);
    expect(boardStats(moved).rooms.get(a)!.n).toBe(1);
  });

  it('adopts loose cards when a room is drawn around them', () => {
    const { board, a, cardA } = twoRooms();
    let loose = '';
    let big = '';
    const s = produce(board, (d) => {
      loose = createItem(d, 2000, 0);
      big = createGroup(d, -100, -100, 2500, 800);
      adoptLooseCards(d, big);
    });
    expect(s.items[loose].room).toBe(big);
    expect(s.items[cardA].room).toBe(a);
  });

  it('moves a dropped card into the room it lands in', () => {
    const { board, b, cardA } = twoRooms();
    const s = produce(board, (d) => {
      d.items[cardA].x += 1000;
      assignRoom(d, [cardA], cardA);
    });
    expect(s.items[cardA].room).toBe(b);
  });

  it('hands the cards of a deleted room to the room around it, or to none', () => {
    let outer = '';
    let inner = '';
    let card = '';
    const b = boardWith((d) => {
      outer = createGroup(d, 0, 0, 2000, 2000, 'Ev');
      inner = createGroup(d, 100, 100, 700, 500, 'Salon');
      card = createItem(d, 100 + PAD, 100 + HEAD + PAD);
    });
    expect(b.items[card].room).toBe(inner);
    const s = produce(b, (d) => deleteGroup(d, inner));
    expect(s.items[card].room).toBe(outer);
    expect(produce(s, (d) => deleteGroup(d, outer)).items[card].room).toBe('');
  });
});

describe('rooms sized by their cards', () => {
  /** Applies a change the way `updateBoard` does: the change, then the room rules. */
  const step = (board: Board, fn: (d: Board) => void, root?: string) =>
    produce(board, (d) => {
      fn(d);
      arrange(d, board, null, root);
    });
  const slot = (g: { x: number; y: number }, col: number, row: number) => ({
    x: g.x + PAD + col * (CARD_W + GAP),
    y: g.y + HEAD + PAD + row * (CARD_H + GAP),
  });
  const heightFor = (rows: number) => HEAD + PAD * 2 + rows * CARD_H + (rows - 1) * GAP;
  /** True when no two rooms are closer than ROOM_GAP. */
  const apart = (b: Board) =>
    Object.values(b.groups).every((p, i, all) =>
      all
        .slice(i + 1)
        .every(
          (q) =>
            p.x >= q.x + q.w + ROOM_GAP ||
            q.x >= p.x + p.w + ROOM_GAP ||
            p.y >= q.y + q.h + ROOM_GAP ||
            q.y >= p.y + p.h + ROOM_GAP,
        ),
    );

  it('lines the cards up in the grid and is exactly as big as it', () => {
    let gid = '';
    const ids: string[] = [];
    const b = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(2), 300);
      ids.push(createItem(d, 30, 400, { room: gid }), createItem(d, 300, 150), createItem(d, 10, 120));
    });
    const g = b.groups[gid];
    expect(g.cols).toBe(2);
    expect(b.items[ids[2]]).toMatchObject(slot(g, 0, 0));
    expect(b.items[ids[1]]).toMatchObject(slot(g, 1, 0));
    expect(b.items[ids[0]]).toMatchObject(slot(g, 0, 1));
    expect(g).toMatchObject({ w: roomWidth(2), h: heightFor(2) });
  });

  it('keeps one empty row when it has no cards', () => {
    let gid = '';
    const b = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, 1000, 900);
    });
    expect(b.groups[gid]).toMatchObject({ cols: 4, w: roomWidth(4), h: heightFor(1) });
  });

  it('grows when a card is added and shrinks when one is deleted, closing the gap', () => {
    let gid = '';
    const ids: string[] = [];
    const one = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(2), 300);
      ids.push(createItem(d, 20, 120), createItem(d, 300, 120));
    });
    expect(one.groups[gid].h).toBe(heightFor(1));
    const two = step(one, (d) => {
      const end = endOfRoom(d.groups[gid]);
      ids.push(createItem(d, end.x, end.y, { room: gid }));
    });
    expect(two.groups[gid].h).toBe(heightFor(2));
    const back = step(two, (d) => deleteItem(d, ids[0]));
    expect(back.groups[gid].h).toBe(heightFor(1));
    expect(back.items[ids[1]]).toMatchObject(slot(back.groups[gid], 0, 0));
    expect(back.items[ids[2]]).toMatchObject(slot(back.groups[gid], 1, 0));
  });

  it('puts a dropped card between the two cards it was dropped between', () => {
    let gid = '';
    const ids: string[] = [];
    const b = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(3), 300);
      for (let i = 0; i < 3; i++) ids.push(createItem(d, PAD + i * (CARD_W + GAP), HEAD + PAD));
    });
    let dropped = '';
    const s = step(b, (d) => {
      dropped = createItem(d, PAD + CARD_W / 2 + 20, HEAD + PAD + 30);
    });
    const g = s.groups[gid];
    expect(s.items[ids[0]]).toMatchObject(slot(g, 0, 0));
    expect(s.items[dropped]).toMatchObject(slot(g, 1, 0));
    expect(s.items[ids[1]]).toMatchObject(slot(g, 2, 0));
    expect(s.items[ids[2]]).toMatchObject(slot(g, 0, 1));
  });

  it('reflows the cards when the number of columns changes', () => {
    let gid = '';
    const ids: string[] = [];
    const b = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(3), 300);
      for (let i = 0; i < 3; i++) ids.push(createItem(d, PAD + i * (CARD_W + GAP), HEAD + PAD));
    });
    const s = step(b, (d) => {
      d.groups[gid].cols = 1;
    });
    const g = s.groups[gid];
    expect(g).toMatchObject({ w: roomWidth(1), h: heightFor(3) });
    ids.forEach((id, i) => expect(s.items[id]).toMatchObject(slot(g, 0, i)));
  });

  it('leaves out the cards being dragged until they are dropped', () => {
    let gid = '';
    const ids: string[] = [];
    const b = step(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(1), 300);
      ids.push(createItem(d, PAD, HEAD + PAD), createItem(d, PAD, 2000, { room: gid }));
    });
    const held = produce(b, (d) => {
      d.items[ids[0]].x = 5000;
      layoutRooms(d, new Set([ids[0]]));
    });
    expect(held.items[ids[0]].x).toBe(5000);
    expect(held.items[ids[1]]).toMatchObject(slot(held.groups[gid], 0, 0));
    expect(held.groups[gid].h).toBe(heightFor(1));
  });

  it('pushes a room another room is moved onto, cards and all, keeping the gap', () => {
    let a = '';
    let c = '';
    let card = '';
    const b = step(emptyBoard(), (d) => {
      a = createGroup(d, 0, 0, roomWidth(2), 300);
      c = createGroup(d, 1000, 0, roomWidth(2), 300);
      card = createItem(d, 1000 + PAD, HEAD + PAD);
    });
    const s = step(
      b,
      (d) => {
        d.groups[a].x = 900;
      },
      a,
    );
    expect(s.groups[a].x).toBe(900);
    expect(apart(s)).toBe(true);
    expect(s.items[card]).toMatchObject(slot(s.groups[c], 0, 0));
  });

  it('passes a push on to the next room', () => {
    const ids: string[] = [];
    const w = roomWidth(1);
    const b = step(emptyBoard(), (d) => {
      for (let i = 0; i < 3; i++) ids.push(createGroup(d, i * (w + ROOM_GAP), 0, w, 300));
    });
    const s = step(
      b,
      (d) => {
        d.groups[ids[0]].x += 120;
      },
      ids[0],
    );
    expect(apart(s)).toBe(true);
    expect(s.groups[ids[2]].x).toBeGreaterThan(b.groups[ids[2]].x);
  });

  it('pushes the room below away when a room grows into it', () => {
    let top = '';
    let below = '';
    const b = step(emptyBoard(), (d) => {
      top = createGroup(d, 0, 0, roomWidth(1), 300);
      below = createGroup(d, 0, heightFor(1) + ROOM_GAP, roomWidth(3), 300);
    });
    const s = step(b, (d) => {
      createItem(d, PAD, HEAD + PAD);
      createItem(d, PAD, 2000, { room: top });
    });
    expect(s.groups[top].h).toBe(heightFor(2));
    expect(s.groups[below].y).toBe(heightFor(2) + ROOM_GAP);
    expect(apart(s)).toBe(true);
  });

  it('leaves rooms that do not touch where they are', () => {
    let far = '';
    const b = step(emptyBoard(), (d) => {
      createGroup(d, 0, 0, roomWidth(1), 300);
      far = createGroup(d, 3000, 3000, roomWidth(1), 300);
    });
    const s = step(b, (d) => {
      createItem(d, PAD, HEAD + PAD);
    });
    expect(s.groups[far]).toMatchObject({ x: 3000, y: 3000 });
  });
});

describe('stacks', () => {
  const twoCards = () => {
    const ids: string[] = [];
    const b = boardWith((d) => {
      ids.push(createItem(d, 1000, 0, { name: 'A', price: 100 }));
      ids.push(createItem(d, 2000, 0, { name: 'B', price: 200 }));
    });
    return { b, ids };
  };

  it('joins a dropped card behind the target and can undo it', () => {
    const { b, ids } = twoCards();
    let undo: ReturnType<typeof joinStack>['before'] | null = null;
    const joined = produce(b, (d) => {
      const r = joinStack(d, [ids[1]], ids[0]);
      undo = r.before;
      expect(r.size).toBe(2);
    });
    expect(stackMap(joined).get(ids[0])).toEqual([ids[1], ids[0]]);
    expect(joined.items[ids[1]]).toMatchObject({ x: 1000, y: 0 });

    const restored = produce(joined, (d) => {
      for (const [i, o] of undo!) Object.assign(d.items[i], o);
    });
    expect(stackMap(restored).size).toBe(0);
    expect(restored.items[ids[1]].x).toBe(2000);
  });

  it('moves a stack to another room as a whole', () => {
    const { b, ids } = twoCards();
    let gid = '';
    const s = produce(b, (d) => {
      joinStack(d, [ids[1]], ids[0]);
      gid = createGroup(d, 0, 400, 500, 400);
      moveToRoom(d, ids[1], gid);
    });
    expect(roomOf(s, s.items[ids[0]])).toBe(gid);
    expect(roomOf(s, s.items[ids[1]])).toBe(gid);
    expect(s.items[ids[0]]).toMatchObject({ x: s.items[ids[1]].x, y: s.items[ids[1]].y });
  });

  it('counts only one card per stack, preferring the bought option', () => {
    const { b, ids } = twoCards();
    const s = produce(b, (d) => {
      joinStack(d, [ids[1]], ids[0]);
      d.items[ids[0]].status = 'bought';
    });
    expect(reps(s).map((r) => r[0])).toEqual([ids[0]]);
    expect(boardStats(s).spent).toBe(100);
  });

  it('cycles and brings options to the front', () => {
    const { b, ids } = twoCards();
    let s = produce(b, (d) => {
      joinStack(d, [ids[1]], ids[0]);
    });
    expect(stackMap(s).get(ids[0])![0]).toBe(ids[1]);
    s = produce(s, (d) => cycleStack(d, ids[0], 1));
    expect(stackMap(s).get(ids[0])![0]).toBe(ids[0]);
    s = produce(s, (d) => bringFront(d, ids[1]));
    expect(stackMap(s).get(ids[0])![0]).toBe(ids[1]);
  });

  it('adds an alternative in front and dissolves a stack of one', () => {
    const { b, ids } = twoCards();
    let alt = '';
    let s = produce(b, (d) => {
      alt = addAlternative(d, ids[0])!;
    });
    expect(stackMap(s).get(ids[0])).toEqual([alt, ids[0]]);
    s = produce(s, (d) => deleteItem(d, alt));
    expect(s.items[ids[0]].stack).toBe('');
  });

  it('detaches a card next to its old stack', () => {
    const { b, ids } = twoCards();
    const s = produce(b, (d) => {
      joinStack(d, [ids[1]], ids[0]);
      detachFromStack(d, ids[1]);
    });
    expect(stackMap(s).size).toBe(0);
    expect(s.items[ids[1]].x).toBe(1000 + CARD_W + GAP + 60);
  });

  it('puts a detached card beside its stack without landing on another card', () => {
    const ids: string[] = [];
    const b = boardWith((d) => {
      ids.push(createItem(d, 0, 0), createItem(d, 2000, 0));
      d.items[ids[1]].x = CARD_W + GAP + 60; // right where the detached card would go
      joinStack(d, [createItem(d, 3000, 0)], ids[0]);
    });
    const alt = Object.keys(b.items).find((i) => !ids.includes(i))!;
    const s = produce(b, (d) => {
      detachFromStack(d, alt);
    });
    const p = s.items[alt];
    const q = s.items[ids[1]];
    const apart =
      p.x >= q.x + CARD_W + MIN_GAP ||
      q.x >= p.x + CARD_W + MIN_GAP ||
      p.y >= q.y + CARD_H + MIN_GAP ||
      q.y >= p.y + CARD_H + MIN_GAP;
    expect(apart).toBe(true);
  });

  it('puts a card taken out of a stack in a room at the end of the room', () => {
    let gid = '';
    const ids: string[] = [];
    const b = produce(emptyBoard(), (d) => {
      gid = createGroup(d, 0, 0, roomWidth(3), 300);
      ids.push(createItem(d, PAD, HEAD + PAD), createItem(d, PAD + CARD_W + GAP, HEAD + PAD));
      addAlternative(d, ids[0]);
      arrange(d, emptyBoard());
    });
    const alt = Object.keys(b.items).find((i) => !ids.includes(i))!;
    const s = produce(b, (d) => {
      detachFromStack(d, ids[0]);
      arrange(d, b);
    });
    const g = s.groups[gid];
    expect(stackMap(s).size).toBe(0);
    expect(s.items[alt]).toMatchObject({ x: g.x + PAD, y: g.y + HEAD + PAD });
    expect(s.items[ids[1]]).toMatchObject({ x: g.x + PAD + CARD_W + GAP });
    expect(s.items[ids[0]]).toMatchObject({ x: g.x + PAD + 2 * (CARD_W + GAP), y: g.y + HEAD + PAD });
    expect(s.items[ids[0]].room).toBe(gid);
  });
});

describe('filters and stats', () => {
  it('matches delivery filters only for bought cards', () => {
    const base = { status: 'bought', delivery: 'shipped' } as const;
    expect(matches({ ...base } as never, 'awaiting')).toBe(true);
    expect(matches({ ...base, delivery: 'delivered' } as never, 'delivered')).toBe(true);
    expect(matches({ status: 'todo', delivery: '' } as never, 'awaiting')).toBe(false);
  });
});

describe('template and tidy', () => {
  it('builds the IKEA sample board with photos, links and two alternative stacks', () => {
    const b = boardWith(buildTemplate);
    expect(Object.values(b.groups).map((g) => g.name)).toEqual(['Salon', 'Yatak odası', 'Mutfak', 'Banyo']);
    expect(Object.keys(b.items)).toHaveLength(23);
    expect(stackMap(b).size).toBe(2);
    for (const it of Object.values(b.items)) {
      expect(it.img).toMatch(/^data:image\/jpeg;base64,/);
      expect(it.link).toMatch(/^https:\/\/www\.ikea\.com\.tr\/urun\//);
      expect(it.price).toBeGreaterThan(0);
    }
    const s = boardStats(b);
    expect(s.counts.all).toBe(21);
    expect(s.counts.awaiting).toBe(3);
  });

  it('places every sample card inside its room without touching another card', () => {
    const b = boardWith(buildTemplate);
    const boxes = [...cardBoxes(b)];
    for (const it of Object.values(b.items)) {
      expect(it.room).not.toBe('');
      expect(roomAt(b, it)).toBe(it.room);
    }
    for (const [i, p] of boxes) {
      for (const [j, q] of boxes) {
        if (i >= j || (b.items[i].stack && b.items[i].stack === b.items[j].stack)) continue;
        const apart = p.x >= q.x + q.w || q.x >= p.x + p.w || p.y >= q.y + q.h || q.y >= p.y + p.h;
        expect(apart, `${b.items[i].name} / ${b.items[j].name}`).toBe(true);
      }
    }
  });

  it('keeps every card in its room when tidying and can be undone exactly', () => {
    const b = boardWith(buildTemplate);
    const rooms = Object.fromEntries(Object.entries(b.items).map(([id, it]) => [id, it.room]));
    const snap = layoutSnapshot(b);
    const t = produce(b, (d) => {
      d.items[Object.keys(d.items)[0]].x += 37; // something to tidy
      tidy(d);
    });
    for (const [id, it] of Object.entries(t.items)) {
      expect(it.room).toBe(rooms[id]);
      expect(roomAt(t, it)).toBe(rooms[id]);
    }
    const undone = produce(t, (d) => restoreLayout(d, snap));
    expect(layoutSnapshot(undone)).toEqual(snap);
  });
});
