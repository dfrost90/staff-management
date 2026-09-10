import DepartmentsForm from "@/components/departments-form";
import SiteHeader from "@/components/site-header";
import { useParams } from "react-router";

const DepartmentFormPage = () => {
  const { id } = useParams();

  return (
    <>
      <SiteHeader title={id ? "Редагувати підрозділ" : "Додати підрозділ"} />
      <section className="space-y-6">
        <DepartmentsForm key={id ?? "new"} departmentId={id} />
      </section>
    </>
  );
};

export default DepartmentFormPage;
