import { Link } from "react-router-dom";

export default function App() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Vibe Playground: Graph Puzzle</h1>
      <p className="text-slate-600">노서버 · 자연어 기반 그래프 퍼즐 샌드박스</p>
      <div className="mt-4">
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" to="/playground">Playground 열기</Link>
      </div>
    </div>
  );
}
