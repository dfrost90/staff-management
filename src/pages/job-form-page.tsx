import JobsForm from "@/components/jobs-form";
import { useParams } from "react-router";

const JobFormPage = () => {
  const { id } = useParams();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">{id ? "Редагувати посаду" : "Додати посаду"}</h1>

      <JobsForm key={id ?? "new"} jobId={id} />
    </section>
  );
};

export default JobFormPage;
