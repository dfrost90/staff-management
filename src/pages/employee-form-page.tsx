import EmployeesForm from "@/components/employees-form";
import SiteHeader from "@/components/site-header";
import { useParams } from "react-router";

const EmployeeFormPage = () => {
  const { id } = useParams();

  return (
    <>
      <SiteHeader title={id ? "Редагувати працівника" : "Додати працівника"} />
      <section className="space-y-6">
        <EmployeesForm key={id ?? "new"} employeeId={id} />
      </section>
    </>
  );
};

export default EmployeeFormPage;
