import { useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './shared/ui/Layout';
import TaskForm from './features/tasks/components/TaskForm';
import HomePage from './pages/HomePage';
import TaskDetailPage from './pages/TaskDetailPage';
import { createTask } from './features/tasks/api/task';

function AppShell() {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <Routes>
        <Route element={<Layout onNewTask={() => setNewTaskOpen(true)} />}>
          <Route index element={<HomePage refreshKey={refresh} />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
        </Route>
      </Routes>

      {newTaskOpen && (
        <TaskForm
          title="New task"
          submitLabel="Create task"
          onSubmit={async (input) => {
            await createTask(input);
            setNewTaskOpen(false);
            navigate('/');
            setRefresh((r) => r + 1);
          }}
          onClose={() => setNewTaskOpen(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}