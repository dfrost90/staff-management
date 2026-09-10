import DepartmentsForm from "@/components/departments-form";
import { useParams } from "react-router";

const DepartmentFormPage = () => {
  const { id } = useParams();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">{id ? "Редагувати підрозділ" : "Додати підрозділ"}</h1>

      <DepartmentsForm key={id ?? "new"} departmentId={id} />
    </section>
  );
};

export default DepartmentFormPage;
