import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "@modules/auth/LoginPage";
import DashboardPage from "@modules/dashboard/DashboardPage";
import AlertsPage from "@modules/alerts/AlertsPage";
import AssignmentsPage from "@modules/assignments/AssignmentsPage";
import SheltersPage from "@modules/shelters/SheltersPage";
import WeatherPage from "@modules/weather/WeatherPage";
import VolunteersPage from "@modules/volunteers/VolunteersPage";
import UsersPage from "@modules/users/UsersPage";
import MapPage from "@modules/map/MapPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/shelters" element={<SheltersPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]} />
            }
          >
            <Route index element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
