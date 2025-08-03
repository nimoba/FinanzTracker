import { AuthWrapper } from './components/AuthWrapper';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  );
}

export default App;
