import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';

// 전체 페이지 라우팅을 관리하는 컴포넌트입니다.
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
