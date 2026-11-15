import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CARD_W, CARD_H, GAP, HEAD, PAD } from '../domain/constants';
import { safeImg } from '../domain/format';
import { stackOf } from '../domain/stacks';
import {
  addAlternative,
  closeMenu,
  createGroupAt,
  createItemAt,
  createItemInRoom,
  detachFromStack,
  openCompare,
  openDrawer,
  removeGroup,
  removeItem,
  startClip,
  tidyAll,
  toast,
} from '../store/actions';
import { setState, useAppStore, type MenuState } from '../store/appStore';
import type { Board } from '../domain/types';
import { undo } from '../store/history';
import { fitAll, viewportRect } from '../store/viewActions';

interface Entry {
  label: string;
  /** The shortcut that does the same, shown on the right so the menu also teaches it. */
  hint?: string;
  danger?: boolean;
  run: () => void;
}
type Section = Entry[];

const MARGIN = 8;

/** The right-click menu: different choices on the empty board, on a room and on a card. */
export function ContextMenu() {
  const menu = useAppStore((s) => s.menu);
  const board = useAppStore((s) => s.board);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', closeMenu);
    window.addEventListener('wheel', closeMenu, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', closeMenu);
      window.removeEventListener('wheel', closeMenu);
    };
  }, [menu]);

  useLayoutEffect(() => {
    if (menu && ref.current) setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
  }, [menu]);

  if (!menu) return null;
  const sections = sectionsFor(menu, board);
  if (!sections.length) return null;

  // Open at the pointer, flipped to stay inside the board area.
  const vp = viewportRect();
  const left = menu.x + size.w + MARGIN > vp.width ? Math.max(MARGIN, menu.x - size.w) : menu.x;
  const top = menu.y + size.h + MARGIN > vp.height ? Math.max(MARGIN, menu.y - size.h) : menu.y;

  return (
    <div ref={ref} className="ctx-menu glass" role="menu" style={{ left, top }}>
      {sections.map((items, i) => (
        <div key={i} className="ctx-section">
          {items.map((e) => (
            <button
              key={e.label}
              type="button"
              role="menuitem"
              className={e.danger ? 'danger' : undefined}
              onClick={() => {
                closeMenu();
                e.run();
              }}
            >
              <span>{e.label}</span>
              {e.hint && <kbd>{e.hint}</kbd>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function sectionsFor(menu: MenuState, board: Board): Section[] {
  const { at, id } = menu;
  if (menu.kind === 'card' && id && board.items[id]) {
    const st = stackOf(board, id);
    const it = board.items[id];
    return [
      [
        { label: 'Düzenle', run: () => openDrawer('item', id) },
        ...(safeImg(it.img)
          ? [{ label: 'Fotoğrafı kes', hint: '⌘X', run: () => void startClip(id, at) }]
          : []),
        { label: 'Alternatif ekle', run: () => addAlternative(id) },
      ],
      ...(st
        ? [
            [
              { label: 'Alternatifleri yan yana gör', hint: '⌘ tık', run: () => openCompare(id) },
              { label: 'Alternatiflerden çıkar', run: () => detachFromStack(id) },
            ],
          ]
        : []),
      [
        {
          label: 'Sil',
          hint: 'Delete',
          danger: true,
          run: () => {
            removeItem(id);
            toast('Eşya silindi.', { label: 'Geri al', run: undo });
          },
        },
      ],
    ];
  }
  if (menu.kind === 'room' && id && board.groups[id]) {
    return [
      [
        { label: 'Bu odaya eşya ekle', hint: 'Çift tık', run: () => createItemInRoom(id) },
        { label: 'Odayı düzenle', run: () => openDrawer('group', id, 'gname') },
      ],
      [
        {
          label: 'Odayı sil',
          danger: true,
          run: () => {
            removeGroup(id);
            toast('Oda silindi, eşyaları panoda kaldı.', { label: 'Geri al', run: undo });
          },
        },
      ],
    ];
  }
  const hasAnything = Object.keys(board.groups).length + Object.keys(board.items).length > 0;
  return [
    [
      {
        label: 'Buraya eşya ekle',
        hint: 'Çift tık',
        run: () => {
          const nid = createItemAt(at.x - CARD_W / 2, at.y - 30);
          setState({ blank: true });
          openDrawer('item', nid, 'name');
        },
      },
      {
        label: 'Buraya oda ekle',
        hint: 'R',
        run: () => {
          const w = PAD * 2 + CARD_W * 2 + GAP;
          const nid = createGroupAt(at.x - w / 2, at.y - 20, w, HEAD + PAD * 2 + CARD_H);
          setState({ blank: true });
          openDrawer('group', nid, 'gname');
        },
      },
    ],
    ...(hasAnything
      ? [
          [
            { label: 'Tümünü göster', hint: '⇧1', run: fitAll },
            { label: 'Kartları düzenle', run: tidyAll },
          ],
        ]
      : []),
  ];
}
