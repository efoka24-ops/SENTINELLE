import { colors } from '../theme';

/** Bandeau tricolore (vert / rouge / or) du drapeau camerounais. */
export function TricolorBar({ height = 5 }: { height?: number }) {
  return (
    <div style={{ height, display: 'flex' }}>
      <div style={{ flex: 1, background: colors.green }} />
      <div style={{ flex: 1, background: colors.red }} />
      <div style={{ flex: 1, background: colors.gold }} />
    </div>
  );
}
