import { Navigate, Route, Routes } from "react-router";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import DepartmentsPage from "./pages/departments-page";
import JobsPage from "./pages/jobs-page";
import StaffingPage from "./pages/staffing-page";
import DepartmentFormPage from "./pages/department-form-page";
import JobFormPage from "./pages/job-form-page";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="min-w-0 flex-1 p-4">
        <SidebarTrigger />

        <Routes>
          <Route path="/" element={<Navigate to="/departments" replace />} />

          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/departments/new" element={<DepartmentFormPage />} />
          <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />

          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<JobFormPage />} />
          <Route path="/jobs/:id/edit" element={<JobFormPage />} />

          <Route path="/staffing" element={<StaffingPage />} />

          <Route path="*" element={<h1>Сторінку не знайдено</h1>} />
        </Routes>
      </main>
    </SidebarProvider>
  );
}

export default App;
