import { Navigate, Route, Routes } from "react-router";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import DepartmentsPage from "./pages/departments-page";
import JobsPage from "./pages/jobs-page";
import DepartmentFormPage from "./pages/department-form-page";
import JobFormPage from "./pages/job-form-page";
import EmployeesPage from "./pages/employees-page";
import AssignmentsPage from "./pages/assignments-page";
import LeaveRequestsPage from "./pages/leave-requests-page";

function App() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <main className="min-w-0 flex-1 p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/departments" replace />} />

            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/new" element={<DepartmentFormPage />} />
            <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />

            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/new" element={<JobFormPage />} />
            <Route path="/jobs/:id/edit" element={<JobFormPage />} />

            <Route path="/staffing" element={<Navigate to="/staffing/employees" replace />} />
            <Route path="/staffing/employees" element={<EmployeesPage />} />
            <Route path="/staffing/assignments" element={<AssignmentsPage />} />
            <Route path="/staffing/leave-requests" element={<LeaveRequestsPage />} />

            <Route path="*" element={<h1>Сторінку не знайдено</h1>} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
