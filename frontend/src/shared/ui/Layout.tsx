import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Kanban, Plus, Moon, Sun } from 'lucide-react';
import './Layout.css';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('todo-app-theme');
  return saved === 'dark' ? 'dark' : 'light';
}

interface LayoutProps {
  onNewTask: () => void;
}

export default function Layout({ onNewTask }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('todo-app-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button type="button" className="brand" onClick={() => navigate('/')}>
            <span className="brand-icon"><Kanban size={20} /></span>
            <span className="brand-mark">42i</span>
            <span className="brand-name">Tasks</span>
            <span className="brand-badge">Enterprise</span>
          </button>
          <div className="header-divider" />
          <h1 className="header-title">
            {location.pathname === '/' ? 'Main Board' : 'Task Details'}
          </h1>
          <div className="header-actions">
            <button
              type="button"
              className="theme-btn"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" className="btn-primary" onClick={onNewTask}>
              <Plus size={16} />
              <span>New task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="content animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}