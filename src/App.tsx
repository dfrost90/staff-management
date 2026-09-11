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
import EmployeeFormPage from "./pages/employee-form-page";
import AssignmentFormPage from "./pages/assignment-form-page";
import LeaveRequestFormPage from "./pages/leave-request-form-page";

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
            <Route path="/staffing/employees/new" element={<EmployeeFormPage />} />
            <Route path="/staffing/employees/:id/edit" element={<EmployeeFormPage />} />

            <Route path="/staffing/assignments" element={<AssignmentsPage />} />
            <Route path="/staffing/assignments/new" element={<AssignmentFormPage />} />
            <Route path="/staffing/assignments/:id/edit" element={<AssignmentFormPage />} />

            <Route path="/staffing/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/staffing/leave-requests/new" element={<LeaveRequestFormPage />} />
            <Route path="/staffing/leave-requests/:id/edit" element={<LeaveRequestFormPage />} />

            <Route path="*" element={<h1>Сторінку не знайдено</h1>} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
