import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { QuickPayPopover } from '../canvas/QuickPayPopover';
import { roomWidth } from '../domain/arrange';
import { CARD_H, DELIV_SHORT, FILTER_LABEL, HEAD, PAD, STATUS } from '../domain/constants';
import { fmt, safeImg, total } from '../domain/format';
import { bounds } from '../domain/geometry';
import { matches } from '../domain/stats';
import type { Board, Filter, Item } from '../domain/types';
import { stacksOf, useBoardStats } from '../hooks/useBoardDerived';
import {
  addAlternative,
  createGroupAt,
  createItemInRoom,
  cycleDelivery,
  cycleStatus,
  openDrawer,
  setFilter,
  startFromTemplate,
} from '../store/actions';
import { getState, selectedId, setState, useAppStore } from '../store/appStore';
import { Drawer } from './drawer/Drawer';
import { ChevronRight, DeliveryIcon, StatusIcon } from './icons';
import { ItemArt } from './ItemArt';
import { StatBar } from './StatBar';
import { Toast } from './Toast';

/*
 * The board as a list, for phones: rooms are sections, cards are rows. Same data and actions as the
 * whiteboard; only the layout differs. A stack of alternatives is one row (its front card).
 */

interface Row {
  id: string;
  it: Item;
  /** Ids of the card's alternatives front to back (the card included), empty when it has none. */
  options: string[];
}

const FILTERS: Filter[] = ['all', 'todo', 'looking', 'bought', 'awaiting', 'delivered'];
const SWATCH: Partial<Record<Filter, string>> = {
  todo: 'var(--status-todo)',
  looking: 'var(--status-looking)',
  bought: 'var(--status-bought)',
};

/** Rows per room id ('' = not in a room), in the order the cards sit on the board. */
function rowsByRoom(board: Board): Map<string, Row[]> {
  const sm = stacksOf(board);
  const out = new Map<string, Row[]>();
  for (const [id, it] of Object.entries(board.items)) {
    const stack = it.stack ? sm.get(it.stack) : undefined;
    if (stack && stack[0] !== id) continue;
    const room = board.groups[it.room] ? it.room : '';
    const list = out.get(room);
    const row = { id, it, options: stack || [] };
    if (list) list.push(row);
    else out.set(room, [row]);
  }
  for (const list of out.values()) list.sort((a, b) => a.it.y - b.it.y || a.it.x - b.it.x);
  return out;
}

/** A new room below everything on the board, opened for naming. */
function addRoom() {
  const b = bounds(getState().board);
  const id = createGroupAt(b ? b.x1 : 0, b ? b.y2 + 80 : 0, roomWidth(2), HEAD + PAD * 2 + CARD_H);
  setState({ blank: true });
  openDrawer('group', id, 'gname');
}

const stop = (fn: () => void) => (e: MouseEvent) => {
  e.stopPropagation();
  fn();
};

function Thumb({ it }: { it: Item }) {
  return (
    <div className="lv-thumb">
      {safeImg(it.img) ? <img src={it.img} alt="" /> : <ItemArt name={it.name} />}
    </div>
  );
}

const price = (it: Item) => {
  const t = total(it);
  return t ? fmt(t) : <span className="muted">fiyat?</span>;
};

/** Status, and for a bought item the delivery: each changes with a tap. */
function Pills({ id, it }: { id: string; it: Item }) {
  const dv = it.delivery || 'pending';
  return (
    <div className="lv-pills">
      <button className="pill-btn" data-act="status" onClick={stop(() => cycleStatus(id))}>
        <StatusIcon status={it.status} />
        {STATUS[it.status]}
      </button>
      {it.status === 'bought' && (
        <button className={'pill-btn dv-' + dv} onClick={stop(() => cycleDelivery(id))}>
          <DeliveryIcon delivery={dv} />
          {DELIV_SHORT[dv]}
        </button>
      )}
    </div>
  );
}

/** Props for a tappable row that opens the item in the inspector. */
const opens = (id: string) => ({
  role: 'button',
  tabIndex: 0,
  onClick: () => openDrawer('item', id),
  onKeyDown: (e: KeyboardEvent) =>
    e.key === 'Enter' && e.target === e.currentTarget && openDrawer('item', id),
});

/** A card, with its alternatives listed under it once "N seçenek" is tapped. */
function ItemRow({ id, it, options, selected }: Row & { selected: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const board = useAppStore((s) => s.board);
  const showAlts = expanded && options.length > 0;
  return (
    <>
      <div className={`lv-item s-${it.status}` + (selected === id ? ' selected' : '')} {...opens(id)}>
        <Thumb it={it} />
        <div className="lv-text">
          <div className="lv-name">
            {it.priority === 'urgent' && <span className="lv-pri" title="Öncelikli" />}
            {it.name || 'İsimsiz eşya'}
          </div>
          <div className="lv-sub">
            {price(it)}
            {options.length > 0 && (
              <button
                type="button"
                className="lv-opts"
                aria-expanded={showAlts}
                onClick={stop(() => setExpanded(!expanded))}
              >
                {`${options.length} seçenek`}
                <ChevronRight />
              </button>
            )}
          </div>
        </div>
        <Pills id={id} it={it} />
      </div>
      {showAlts && (
        <div className="lv-alts">
          {options.map((aid) => {
            const a = board.items[aid];
            return (
              <div
                key={aid}
                className={`lv-item lv-alt s-${a.status}` + (selected === aid ? ' selected' : '')}
                {...opens(aid)}
              >
                <Thumb it={a} />
                <div className="lv-text">
                  <div className="lv-name">{a.name || 'İsimsiz eşya'}</div>
                  <div className="lv-sub">{price(a)}</div>
                </div>
                <Pills id={aid} it={a} />
              </div>
            );
          })}
          <button type="button" className="lv-add lv-alt" onClick={() => addAlternative(id)}>
            <span aria-hidden="true">+</span> Alternatif ekle
          </button>
        </div>
      )}
    </>
  );
}

function Chips() {
  const filter = useAppStore((s) => s.filter);
  const { counts } = useBoardStats();
  return (
    <div className="lv-chips" role="radiogroup" aria-label="Eşyaları filtrele">
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={filter === f}
          className={'lv-chip' + (counts[f] ? '' : ' zero')}
          onClick={() => setFilter(f)}
        >
          {SWATCH[f] && <i style={{ background: SWATCH[f] }} />}
          {FILTER_LABEL[f]}
          <span>{counts[f]}</span>
        </button>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="lv-empty">
      <h1>Yeni evimiz</h1>
      <p>
        Her oda için bir bölüm aç, alacağın eşyaları içine ekle. Fiyatı, bütçeyi ve teslimatı buradan takip
        et.
      </p>
      <button type="button" className="btn primary" onClick={() => void startFromTemplate()}>
        Örnek odalarla başla
      </button>
      <button type="button" className="btn" onClick={addRoom}>
        Oda ekle
      </button>
    </div>
  );
}

export function ListView() {
  const board = useAppStore((s) => s.board);
  const filter = useAppStore((s) => s.filter);
  const selected = useAppStore(selectedId);
  const { rooms: roomStats } = useBoardStats();
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());

  const rows = useMemo(() => rowsByRoom(board), [board]);
  const rooms = useMemo(
    () => Object.entries(board.groups).sort(([, a], [, b]) => a.y - b.y || a.x - b.x),
    [board],
  );

  const toggle = (gid: string) =>
    setClosed((s) => {
      const n = new Set(s);
      if (!n.delete(gid)) n.add(gid);
      return n;
    });
  const shown = (room: string) => (rows.get(room) || []).filter((r) => matches(r.it, filter));
  const renderRows = (list: Row[]) =>
    // Keyed by the stack, so the alternatives stay open when another one comes to the front.
    list.map((r) => <ItemRow key={r.it.stack || r.id} {...r} selected={selected} />);
  const loose = shown('');

  return (
    <main className="list-view">
      <div className="lv-scroll">
        {!rooms.length && !rows.size ? (
          <Empty />
        ) : (
          <>
            <StatBar />
            <Chips />
            {rooms.map(([gid, g]) => {
              const list = shown(gid);
              if (filter !== 'all' && !list.length) return null;
              const st = roomStats.get(gid);
              const open = !closed.has(gid);
              return (
                <section key={gid} className="lv-room">
                  <div className="lv-room-head">
                    <button
                      type="button"
                      className="lv-room-toggle"
                      aria-expanded={open}
                      onClick={() => toggle(gid)}
                    >
                      <ChevronRight />
                      <i className="lv-dot" style={{ background: g.color }} />
                      <span className="lv-room-name">{g.name}</span>
                      {st && (
                        <span className="lv-room-meta">{`${st.done}/${st.n} alındı · ${fmt(st.sum)}`}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="tbtn"
                      aria-label={`${g.name} odasını düzenle`}
                      title="Odayı düzenle"
                      onClick={() => openDrawer('group', gid, 'gname')}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="5" cy="12" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="19" cy="12" r="1.8" />
                      </svg>
                    </button>
                  </div>
                  {open && (
                    <>
                      {renderRows(list)}
                      {filter === 'all' && (
                        <button type="button" className="lv-add" onClick={() => createItemInRoom(gid)}>
                          <span aria-hidden="true">+</span> Eşya ekle
                        </button>
                      )}
                    </>
                  )}
                </section>
              );
            })}
            {loose.length > 0 && (
              <section className="lv-room">
                <div className="lv-room-head">
                  <span className="lv-room-toggle lv-loose">Odası olmayanlar</span>
                </div>
                {renderRows(loose)}
              </section>
            )}
            <button type="button" className="btn lv-add-room" onClick={addRoom}>
              Oda ekle
            </button>
          </>
        )}
      </div>
      <Drawer />
      <QuickPayPopover docked />
      <Toast />
    </main>
  );
}
