import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// 임시 홈 페이지 컴포넌트
const HomePage = () => <div>Home Page</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);
