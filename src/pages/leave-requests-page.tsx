import SiteHeader from "@/components/site-header";

const LeaveRequestsPage = () => {
  return (
    <>
      <SiteHeader title="Заявки на відпустку" />
      <section className="space-y-6">
        <p>Заявок на відпустку немає</p>
      </section>
    </>
  );
};

export default LeaveRequestsPage;
