import { useState } from 'react';
import { useGlobalStats } from '../features/tasks/hooks/useGlobalStats';
import { useTaskMutations } from '../features/tasks/hooks/useTaskMutations';
import StatsBar from '../features/tasks/components/StatsBar';
import TaskBoard from '../features/tasks/components/TaskBoard';
import TaskForm from '../features/tasks/components/TaskForm';
import type { TaskNode } from '../features/tasks/types/task';

interface HomePageProps {
  refreshKey: number;
}

export default function HomePage({ refreshKey }: HomePageProps) {
  const [bump, setBump] = useState(0);
  const [subtaskParent, setSubtaskParent] = useState<TaskNode | null>(null);

  const stats = useGlobalStats(refreshKey + bump);
  const { createSubtask } = useTaskMutations();

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