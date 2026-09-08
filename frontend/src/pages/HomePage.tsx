import { useEffect, useState } from 'react';
import { createSubtask, getStats } from '../api/task';
import StatsBar from '../components/StatsBar';
import TaskBoard from '../components/TaskBoard';
import TaskForm from '../components/TaskForm';
import type { GlobalStats, TaskNode } from '../types/task';

interface HomePageProps {
  refreshKey: number;
}

export default function HomePage({ refreshKey }: HomePageProps) {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [bump, setBump] = useState(0);
  const [subtaskParent, setSubtaskParent] = useState<TaskNode | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey, bump]);

  return (
    <div>
      <StatsBar stats={stats} />

      <TaskBoard refreshKey={refreshKey + bump} onAddSubtask={setSubtaskParent} />

      {subtaskParent && (
        <TaskForm
          title={`Add subtask to “${subtaskParent.title}”`}
          submitLabel="Create subtask"
          onSubmit={async (input) => {
            await createSubtask(subtaskParent.id, input);
            setSubtaskParent(null);
            setBump((b) => b + 1);
          }}
          onClose={() => setSubtaskParent(null)}
        />
      )}
    </div>
  );
}