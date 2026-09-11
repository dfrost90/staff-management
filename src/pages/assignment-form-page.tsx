import AssignmentsForm from "@/components/assignments-form";
import SiteHeader from "@/components/site-header";
import { useParams } from "react-router";

const AssignmentFormPage = () => {
  const { id } = useParams();

  return (
    <>
      <SiteHeader title={id ? "Редагувати призначення" : "Додати призначення"} />
      <section className="space-y-6">
        <AssignmentsForm key={id ?? "new"} assignmentId={id} />
      </section>
    </>
  );
};

export default AssignmentFormPage;
