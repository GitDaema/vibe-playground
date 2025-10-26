import { Link } from "react-router-dom";

export default function App() {
  return (
    // 목적: 전체 화면을 차지하는 중앙 정렬 컨테이너로 변경
    <div className="min-h-screen grid place-items-center bg-gray-50 text-center">
      {/* 목적: 컨텐츠 영역의 최대 너비를 제한하고 수직 스택으로 구성 */}
      <div className="space-y-6">
        {/* 목적: 메인 타이틀의 폰트 크기와 색상 조정 */}
        <h1 className="text-5xl font-bold text-gray-800">
          Vibe Playground
        </h1>
        {/* 목적: 부제의 폰트 크기와 색상(대비) 조정 */}
        <p className="text-lg text-gray-500">
          서버 없는 환경에서 자연어로 만드는 그래프 퍼즐 샌드박스
        </p>
        {/* 목적: CTA 버튼에 그래디언트, 그림자, 호버 효과를 적용하여 시각적 강조 */}
        <Link
          to="/playground"
          className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg hover:opacity-90 transition-transform transform hover:-translate-y-1"
        >
          퍼즐 만들러 가기
        </Link>
      </div>
    </div>
  );
}
