import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

const noop = () => {};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onNewTask={noop} />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}