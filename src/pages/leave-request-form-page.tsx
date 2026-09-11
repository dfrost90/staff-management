import LeaveRequestsForm from "@/components/leave-requests-form";
import SiteHeader from "@/components/site-header";
import { useParams } from "react-router";

const LeaveRequestFormPage = () => {
  const { id } = useParams();

  return (
    <>
      <SiteHeader title={id ? "Редагувати заявку на відпустку" : "Додати заявку на відпустку"} />
      <section className="space-y-6">
        <LeaveRequestsForm key={id ?? "new"} leaveId={id} />
      </section>
    </>
  );
};

export default LeaveRequestFormPage;
