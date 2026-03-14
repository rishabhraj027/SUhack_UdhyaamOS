import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import Login from "./pages/Login";
import LoginSuccess from "./pages/LoginSuccess";
import { useAuthStore } from "./store/useAuthStore";

import BusinessLayout from "./layouts/BusinessLayout";
import TradeSync from "./pages/business/TradeSync";
import TalentBridge from "./pages/business/TalentBridge";
import UdhyaamNetwork from "./pages/business/UdhyaamNetwork";
import BusinessVault from "./pages/business/DigitalVault";
import BusinessProfile from "./pages/business/BusinessProfile";
import ProjectTimelines from "./pages/business/ProjectTimelines";

import JuniorProLayout from "./layouts/JuniorProLayout";
import JobBoard from "./pages/junior-pro/JobBoard";
import ActiveTasks from "./pages/junior-pro/ActiveTasks";
import JuniorProVault from "./pages/junior-pro/DigitalVault";
import PublicProfile from "./pages/junior-pro/PublicProfile";
import JuniorProMessages from "./pages/junior-pro/Messages";

import BusinessMessages from "./pages/business/Messages";

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />

        <Route path="/" element={<RootLayout />}>
          <Route
            index
            element={
              <Navigate
                to={user?.role === "JuniorPro" ? "/junior-pro" : "/business"}
                replace
              />
            }
          />

          <Route element={<ProtectedRoute allowedRole="Business" />}>
            <Route path="business" element={<BusinessLayout />}>
              <Route index element={<TradeSync />} />
              <Route path="talent" element={<TalentBridge />} />
              <Route path="timelines" element={<ProjectTimelines />} />
              <Route path="messages" element={<BusinessMessages />} />
              <Route path="network" element={<UdhyaamNetwork />} />
              <Route path="vault" element={<BusinessVault />} />
              <Route path="profile" element={<BusinessProfile />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRole="JuniorPro" />}>
            <Route path="junior-pro" element={<JuniorProLayout />}>
              <Route index element={<JobBoard />} />
              <Route path="tasks" element={<ActiveTasks />} />
              <Route path="messages" element={<JuniorProMessages />} />
              <Route path="vault" element={<JuniorProVault />} />
              <Route path="profile" element={<PublicProfile />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
