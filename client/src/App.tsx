import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProgramDetail from './pages/ProgramDetail';
import OperationDetail from './pages/OperationDetail';
import ControlForm from './pages/ControlForm';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/programs/:id" element={<PrivateRoute><ProgramDetail /></PrivateRoute>} />
        <Route path="/operations/:id" element={<PrivateRoute><OperationDetail /></PrivateRoute>} />
        <Route path="/controls/:id" element={<PrivateRoute><ControlForm /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
      </Routes>
    </div>
  );
}
