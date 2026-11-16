import { useSyncExternalStore } from 'react';
import { useAppStore } from '../store/appStore';

const PHONE = '(max-width: 640px)';

const subscribe = (cb: () => void) => {
  const m = window.matchMedia(PHONE);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

/** The screen is phone-sized. */
export const useNarrow = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches);

/** Phones show the board as a list unless the user switched to the whiteboard. */
export function useListMode(): boolean {
  const narrow = useNarrow();
  const listView = useAppStore((s) => s.listView);
  return narrow && listView;
}
