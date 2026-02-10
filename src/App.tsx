import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Services from "./pages/Services";
import Quotations from "./pages/Quotations";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import ActivityLogs from "./pages/ActivityLogs";
import ClientAccess from "./pages/ClientAccess";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

// Client Portal Pages
import ClientLogin from "./pages/client-portal/ClientLogin";
import ClientProjects from "./pages/client-portal/ClientProjects";
import ClientProjectDetail from "./pages/client-portal/ClientProjectDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ClientAuthProvider>
              <CompanyProvider>
                <Routes>
                  {/* Admin/Staff Auth */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Client Portal Routes */}
                  <Route path="/client-login" element={<ClientLogin />} />
                  <Route
                    path="/client-portal"
                    element={
                      <ClientProtectedRoute>
                        <ClientProjects />
                      </ClientProtectedRoute>
                    }
                  />
                  <Route
                    path="/client-portal/project/:projectId"
                    element={
                      <ClientProtectedRoute>
                        <ClientProjectDetail />
                      </ClientProtectedRoute>
                    }
                  />

                  {/* Admin/Staff Routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/leads" element={<Leads />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route
                              path="/projects/:projectId"
                              element={<ProjectDetail />}
                            />
                            <Route path="/services" element={<Services />} />
                            <Route
                              path="/quotations"
                              element={<Quotations />}
                            />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/users" element={<Users />} />
                            <Route
                              path="/client-access"
                              element={<ClientAccess />}
                            />
                            <Route path="/roles" element={<Roles />} />
                            <Route
                              path="/permissions"
                              element={<Permissions />}
                            />
                            <Route
                              path="/activity-logs"
                              element={<ActivityLogs />}
                            />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </CompanyProvider>
            </ClientAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
