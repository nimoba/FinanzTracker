import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';

function App() {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="analytics" element={<div className="text-dark-primary">Analytics page coming soon!</div>} />
            <Route path="goals" element={<div className="text-dark-primary">Goals page coming soon!</div>} />
          </Route>
        </Routes>
      </AuthWrapper>
    </Router>
  );
}

export default App;
