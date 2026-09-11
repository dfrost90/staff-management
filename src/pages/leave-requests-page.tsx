import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatAssignment, type AssignmentLabelData } from "@/lib/format-assignment";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/table-pagination";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

type LeaveRequest = {
  leave_id: string;
  start_date: string;
  end_date: string;
  assignment: AssignmentLabelData | null;
};

type SortColumn = "employee_last_name" | "start_date" | "end_date";

const columns: { key: SortColumn; label: string }[] = [
  { key: "employee_last_name", label: "Призначення" },
  { key: "start_date", label: "Початок відпустки" },
  { key: "end_date", label: "Завершення відпустки" },
];

const PAGE_SIZE = 20;

const LeaveRequestsPage = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leaveRequestToDelete, setLeaveRequestToDelete] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [sort, setSort] = useState<{
    column: SortColumn;
    ascending: boolean;
  }>({
    column: "start_date",
    ascending: true,
  });

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSort(column: SortColumn) {
    setPage(0);
    setSort((current) => ({
      column,
      ascending: current.column === column ? !current.ascending : true,
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadLeaveRequests() {
      setLoading(true);
      setError(null);

      try {
        const from = page * PAGE_SIZE;

        const { data, count, error } = await supabase
          .from("leave_requests_view")
          .select(
            `
            leave_id, 
            start_date,
            end_date,
            assignment:assignments(
            start_date,
            end_date,
            employee:employees(last_name, first_name, patronymic),
            job:jobs(title),
            department:departments(short_name)
            )
          `,
            { count: "exact" },
          )
          .order(sort.column, { ascending: sort.ascending })
          .order("leave_id", { ascending: true })
          .range(from, from + PAGE_SIZE - 1)
          .overrideTypes<LeaveRequest[], { merge: false }>();

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        const rowCount = count ?? 0;
        const lastPage = Math.max(0, Math.ceil(rowCount / PAGE_SIZE) - 1);

        setTotal(rowCount);

        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setLeaveRequests(data ?? []);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Не вдалося завантажити відпустки");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaveRequests();

    return () => {
      cancelled = true;
    };
  }, [page, sort.column, sort.ascending, refreshKey]);

  async function handleDelete() {
    if (!leaveRequestToDelete || deleting) return;

    const id = leaveRequestToDelete.leave_id;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from("leave_requests")
        .delete()
        .eq("leave_id", id)
        .select("leave_id")
        .single();

      if (error) {
        setDeleteError("Помилка видалення заявки на відпустку");

        return;
      }

      setRefreshKey((current) => current + 1);
      setLeaveRequestToDelete(null);
    } catch {
      setDeleteError("Не вдалося виконати видалення");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SiteHeader title="Заявки на відпустку">
        <Button nativeButton={false} render={<Link to="/staffing/leave-requests/new" />}>
          Додати заявку на відпустку
        </Button>
      </SiteHeader>
      <section className="space-y-6">
        {loading ? (
          <p role="status">Завантаження...</p>
        ) : error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : leaveRequests.length === 0 ? (
          <p className="text-muted-foreground">Заявок на відпустку поки немає.</p>
        ) : (
          <Table>
            <TableCaption>Відпустки</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="whitespace-normal">
                    <Button type="button" variant="ghost" onClick={() => handleSort(column.key)}>
                      {column.label}
                      {sort.column === column.key && <span>{sort.ascending ? "↑" : "↓"}</span>}
                    </Button>
                  </TableHead>
                ))}
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((leaveRequest) => (
                <TableRow key={leaveRequest.leave_id}>
                  <TableCell className="whitespace-normal">
                    {leaveRequest.assignment ? formatAssignment(leaveRequest.assignment) : "-"}
                  </TableCell>
                  <TableCell className="whitespace-normal">{leaveRequest.start_date}</TableCell>
                  <TableCell className="whitespace-normal">{leaveRequest.end_date}</TableCell>
                  <TableCell className="space-x-2 whitespace-normal">
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link to={`/staffing/leave-requests/${leaveRequest.leave_id}/edit`} />
                      }
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteError(null);
                        setLeaveRequestToDelete(leaveRequest);
                      }}
                    >
                      Видалити
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!error && (
          <TablePagination
            page={page}
            pageCount={pageCount}
            busy={loading || deleting}
            onPageChange={setPage}
          />
        )}

        <DeleteConfirmationDialog
          open={leaveRequestToDelete !== null}
          title="Видалити заявку на відпустку"
          description={`Заявку на відпустку "${leaveRequestToDelete?.start_date} - ${leaveRequestToDelete?.end_date}", буде видалено`}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            setLeaveRequestToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      </section>
    </>
  );
};

export default LeaveRequestsPage;
