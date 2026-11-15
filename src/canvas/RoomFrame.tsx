import { memo, type CSSProperties } from 'react';
import { CARD_H, CARD_W, CHIPS, HEAD, PAD } from '../domain/constants';
import { fmt } from '../domain/format';
import type { RoomStat } from '../domain/stats';
import type { Group } from '../domain/types';
import { createItemInRoom } from '../store/actions';

interface Props {
  id: string;
  group: Group;
  stat: RoomStat;
  selected: boolean;
  dragging: boolean;
  /** A card is dragged over this room and would move into it. */
  dropInto: boolean;
}

export const RoomFrame = memo(function RoomFrame({
  id,
  group: g,
  stat,
  selected,
  dragging,
  dropInto,
}: Props) {
  const style = {
    left: g.x,
    top: g.y,
    width: g.w,
    height: g.h,
    '--chip': g.color || CHIPS[0],
  } as CSSProperties;

  return (
    <div
      className={
        'room' +
        (selected ? ' selected' : '') +
        (dragging ? ' dragging' : '') +
        (dropInto ? ' drop-into' : '')
      }
      data-id={id}
      style={style}
    >
      <div className="room-head">
        <span className="r-name">{g.name || 'İsimsiz oda'}</span>
        <svg className="swoosh" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 9 C 40 3, 90 12, 130 6 S 185 4, 198 8" />
        </svg>
      </div>
      <div className="r-meta">
        <span className="r-count">{stat.n ? `${stat.done}/${stat.n} alındı` : 'henüz boş'}</span>
        <span className="r-sum">{stat.sum ? fmt(stat.sum) : ''}</span>
      </div>
      {stat.n === 0 && (
        // An empty room shows where its first card goes, and that a double-click adds one too.
        <button
          type="button"
          className="room-add"
          style={{ left: PAD, top: HEAD + PAD, width: CARD_W, height: CARD_H }}
          onClick={() => createItemInRoom(id)}
        >
          <span className="room-add-plus">+</span>
          Eşya ekle
          <small>ya da panoda çift tıkla</small>
        </button>
      )}
      <div className="room-resize" title="Sütun sayısını değiştir" />
    </div>
  );
});
