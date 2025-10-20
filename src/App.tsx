import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div>
      <header className="p-4 bg-gray-800 text-white">
        <h1>Vibe Playground</h1>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
