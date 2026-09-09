import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { TaskSummary } from '../types/task';
import './TaskBreadcrumbs.css';

export default function TaskBreadcrumbs({
  parents,
  current,
}: {
  parents: TaskSummary[];
  current: string;
}) {
  if (parents.length === 0) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {parents.map((parent) => (
        <span className="crumb" key={parent.id}>
          <Link to={`/tasks/${parent.id}`}>{parent.title}</Link>
          <ChevronRight size={12} className="crumb-sep" />
        </span>
      ))}
      <span className="crumb crumb--current">{current}</span>
    </nav>
  );
}