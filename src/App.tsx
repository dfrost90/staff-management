import { Navigate, Route, Routes } from "react-router";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { DepartmentsPage } from "./pages/departments-page";
import { JobsPage } from "./pages/jobs-page";
import { StaffingPage } from "./pages/staffing-page";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="min-w-0 flex-1 p-4">
        <SidebarTrigger />

        <Routes>
          <Route path="/" element={<Navigate to="/departments" replace />} />

          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/staffing" element={<StaffingPage />} />

          <Route path="*" element={<h1>Сторінку не знайдено</h1>} />
        </Routes>
      </main>
    </SidebarProvider>
  );
}

export default App;
