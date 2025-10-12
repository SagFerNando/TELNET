import { AuthProvider } from './components/auth/AuthProvider';
import { AppWithAuth } from './components/AppWithAuth';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
      <Toaster />
    </AuthProvider>
  );
}
