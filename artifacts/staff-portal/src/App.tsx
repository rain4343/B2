import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { AuthProvider, useAuth } from '@/lib/auth';

import Dashboard from '@/pages/Dashboard';
import StaffList from '@/pages/StaffList';
import StaffForm from '@/pages/StaffForm';
import Departments from '@/pages/Departments';
import DepartmentDetail from '@/pages/DepartmentDetail';
import Roles from '@/pages/Roles';
import Documents from '@/pages/Documents';
import DocumentForm from '@/pages/DocumentForm';
import DocumentDetail from '@/pages/DocumentDetail';
import Login from '@/pages/Login';

const queryClient = new QueryClient();

function ProtectedRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/staff" component={StaffList} />
        <Route path="/staff/new" component={StaffForm} />
        <Route path="/staff/:id" component={StaffForm} />
        <Route path="/departments" component={Departments} />
        <Route path="/departments/:id" component={DepartmentDetail} />
        <Route path="/roles" component={Roles} />
        <Route path="/documents" component={Documents} />
        <Route path="/documents/new" component={DocumentForm} />
        <Route path="/documents/:id/edit" component={DocumentForm} />
        <Route path="/documents/:id" component={DocumentDetail} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <ProtectedRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
