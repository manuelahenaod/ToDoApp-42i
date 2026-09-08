import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  onNewTask: () => void;
}

export default function Layout({ onNewTask }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button type="button" className="brand" onClick={() => navigate('/')}>
            <span className="brand-mark">42i</span>
            <span className="brand-name">Tasks</span>
          </button>
          <h1 className="header-title">
            {location.pathname === '/' ? 'Board' : 'Task Details'}
          </h1>
          <button type="button" className="btn-primary" onClick={onNewTask}>
            + New task
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}