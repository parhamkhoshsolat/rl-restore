// Top-level error boundary so a render crash never leaves a blank page.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={errStyle.wrap}>
          <div style={errStyle.card}>
            <div style={errStyle.title}>Something broke while rendering.</div>
            <p style={errStyle.body}>{this.state.error.message}</p>
            <button style={errStyle.btn} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const errStyle = {
  wrap: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    background: '#0B0E14',
    color: '#E6EAF2',
    fontFamily: 'Inter, sans-serif',
    padding: 24,
  },
  card: {
    maxWidth: 440,
    textAlign: 'center' as const,
    padding: 28,
    borderRadius: 12,
    background: '#141925',
    border: '1px solid #252C3B',
  },
  title: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  body: { fontSize: 14, color: '#9AA4B8', marginBottom: 18 },
  btn: {
    height: 44,
    padding: '0 22px',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    background: 'linear-gradient(135deg,#4F7CFF,#9B6BFF)',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
