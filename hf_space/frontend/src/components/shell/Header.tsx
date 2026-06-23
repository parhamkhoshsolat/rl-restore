// App header: wordmark, mock-mode badge, theme toggle. Sticky on desktop.
import { isMockActive } from '../../api/client';
import { Pill } from '../ui/Primitives';
import './header.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onHome: () => void;
}

export function Header({ theme, onToggleTheme, onHome }: Props) {
  return (
    <header className="appheader">
      <button className="appheader__brand" onClick={onHome} aria-label="Home">
        <span className="appheader__mark" aria-hidden>
          <span className="appheader__mark-dot" />
        </span>
        <span className="appheader__name">
          RL<span className="appheader__name-accent">·</span>Restore
        </span>
      </button>

      <div className="appheader__right">
        {isMockActive() && <Pill tone="warn">demo data</Pill>}
        <button
          className="appheader__theme"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}
