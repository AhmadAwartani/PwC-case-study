import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { RequireAuth, RequireRole } from "./components/RouteGuards";
import { LoginPage } from "./pages/LoginPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { TicketQueuePage } from "./pages/TicketQueuePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Each role lands on a dashboard suited to what it actually needs, rather
 * than one generic screen with elements hidden/shown by role: a "user"
 * gets their own ticket list; moderator/admin get the shared, filterable
 * queue (Section 4 of the assignment).
 */
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === "user") return <UserDashboardPage />;
  return <TicketQueuePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route
          path="/dashboard"
          element={
            <Layout>
              <DashboardRouter />
            </Layout>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <Layout>
              <TicketDetailPage />
            </Layout>
          }
        />

        <Route element={<RequireRole roles={["admin"]} />}>
          <Route
            path="/admin/users"
            element={
              <Layout>
                <AdminUsersPage />
              </Layout>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <Layout>
                <AdminCategoriesPage />
              </Layout>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
