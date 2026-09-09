import { ChevronRight, Plus, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TaskNode } from '../types/task';
import './SubtreeList.css';

interface SubtreeListProps {
  node: TaskNode;
  onAddSubtask: () => void;
}

export default function SubtreeList({ node, onAddSubtask }: SubtreeListProps) {
  return (
    <section className="detail-card">
      <div className="subtree-head">
        <h3>
          Subtasks <span className="subtree-count">({node.subtasks.length})</span>
        </h3>
        <button type="button" className="add-btn" onClick={onAddSubtask}>
          <Plus size={15} /> Add subtask
        </button>
      </div>

      {node.subtasks.length === 0 ? (
        <p className="subtree-empty">No subtasks yet.</p>
      ) : (
        <div className="subtree">
          <SubtreeNode node={node} />
        </div>
      )}
    </section>
  );
}

function SubtreeNode({ node, depth = 0 }: { node: TaskNode; depth?: number }) {
  const children = Array.isArray(node.subtasks) ? node.subtasks : [];
  if (depth > 2) return null;
  return (
    <div className="subtree-group">
      {children.map((child) => (
        <div key={child.id}>
          <Link className={`task-row task-row--depth-${depth}`} to={`/tasks/${child.id}`}>
            <span className={`status-dot status-dot--${child.status}`} />
            <span className={`row-title${child.status === 'done' ? ' row-title--done' : ''}`}>{child.title}</span>
            {depth === 2 && child.subtasks.length > 0 && (
              <span className="task-dots" aria-label="Open subtasks" title="Open subtasks">⋯</span>
            )}
            <span className="row-effort"><Zap size={11} /> {child.total_effort ?? 0}</span>
            <ChevronRight size={15} className="row-chevron" />
          </Link>
          <SubtreeNode node={child} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}