import { markTipSeen } from '../store/actions';
import { useAppStore } from '../store/appStore';

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * A one-time tip about the quick ways to add cards, which are easy to miss: shown once the board is in
 * use, until it is dismissed or the user has double-clicked or right-clicked on the board.
 */
export function Tip() {
  const show = useAppStore(
    (s) =>
      !s.tipSeen &&
      !s.drawer &&
      (s.blank || Object.keys(s.board.groups).length > 0 || Object.keys(s.board.items).length > 0),
  );
  if (!show) return null;
  return (
    <div className="tip glass" role="note">
      <span>
        {coarse() ? (
          <>
            Eşya eklemek için üstteki <b>not</b> simgesine, sonra panoda bir yere dokun.
          </>
        ) : (
          <>
            <b>Çift tıkla:</b> yeni eşya · <b>Sağ tıkla:</b> diğer seçenekler
          </>
        )}
      </span>
      <button type="button" className="tip-ok" onClick={markTipSeen}>
        Tamam
      </button>
    </div>
  );
}
