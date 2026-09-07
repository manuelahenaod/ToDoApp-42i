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
          <div className="brand" onClick={() => navigate('/')}>
            <span className="brand-mark">42i</span>
          </div>
          <h1 className="header-title">
            {location.pathname === '/' ? 'Task Manager' : 'Task Details'}
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