import JobsForm from "@/components/jobs-form";
import SiteHeader from "@/components/site-header";
import { useParams } from "react-router";

const JobFormPage = () => {
  const { id } = useParams();

  return (
    <>
      <SiteHeader title={id ? "Редагувати посаду" : "Додати посаду"} />
      <section className="space-y-6">
        <JobsForm key={id ?? "new"} jobId={id} />
      </section>
    </>
  );
};

export default JobFormPage;
