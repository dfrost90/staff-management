import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
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

type Assignment = {
  assignment_id: string;
  start_date: string;
  end_date: string | null;
  employee: {
    last_name: string;
    first_name: string;
    patronymic: string | null;
  } | null;
  job: {
    title: string;
  } | null;
  department: {
    name: string;
  } | null;
};

type SortColumn = "employee" | "job" | "department" | "start_date" | "end_date";

const PAGE_SIZE = 20;

const columns: { key: SortColumn; label: string }[] = [
  { key: "employee", label: "Працівник" },
  { key: "job", label: "Посада" },
  { key: "department", label: "Підрозділ" },
  { key: "start_date", label: "Дата початку" },
  { key: "end_date", label: "Дата завершення" },
];

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [sort, setSort] = useState<{
    column: SortColumn;
    ascending: boolean;
  }>({
    column: "employee",
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

    async function loadAssignments() {
      setLoading(true);
      setError(null);

      try {
        const from = page * PAGE_SIZE;

        let query = supabase.from("assignments").select(
          `
            assignment_id, 
            start_date,
            end_date,
            employee:employees(last_name, first_name, patronymic),
            job:jobs(title),
            department:departments(name)
          `,
          { count: "exact" },
        );

        const orderOptions = {
          ascending: sort.ascending,
          nullsFirst: false,
        };

        switch (sort.column) {
          case "employee":
            query = query
              .order("employee(last_name)", orderOptions)
              .order("employee(first_name)", orderOptions)
              .order("employee(patronymic)", orderOptions);
            break;

          case "job":
            query = query.order("job(title)", orderOptions);
            break;

          case "department":
            query = query.order("department(name)", orderOptions);
            break;

          default:
            query = query.order(sort.column, orderOptions);
        }

        const { data, count, error } = await query
          .order("assignment_id", { ascending: true })
          .range(from, from + PAGE_SIZE - 1)
          .overrideTypes<Assignment[], { merge: false }>();

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
        setAssignments(data ?? []);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Не вдалося завантажити призначення");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [page, sort.column, sort.ascending, refreshKey]);

  async function handleDelete() {
    if (!assignmentToDelete || deleting) return;

    const id = assignmentToDelete.assignment_id;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("assignment_id", id)
        .select("assignment_id")
        .single();

      if (error) {
        setDeleteError("Помилка видалення призначення");

        return;
      }

      setRefreshKey((current) => current + 1);
      setAssignmentToDelete(null);
    } catch {
      setDeleteError("Не вдалося виконати видалення");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SiteHeader title="Призначення" loading={loading}>
        <Button nativeButton={false} render={<Link to="/staffing/assignments/new" />}>
          Додати призначення
        </Button>
      </SiteHeader>
      <section className="space-y-6">
        {loading ? (
          <p role="status">Завантаження...</p>
        ) : error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-muted-foreground">Призначень поки немає.</p>
        ) : (
          <Table>
            <TableCaption>Призначення</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="max-w-sm">
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
              {assignments.map((assignment) => (
                <TableRow key={assignment.assignment_id}>
                  <TableCell className="whitespace-normal">
                    {assignment.employee
                      ? [
                          assignment.employee.last_name,
                          assignment.employee.first_name,
                          assignment.employee.patronymic,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : "-"}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {assignment.job?.title ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {assignment.department?.name ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-normal">{assignment.start_date}</TableCell>
                  <TableCell className="whitespace-normal">{assignment.end_date ?? "—"}</TableCell>
                  <TableCell className="space-x-2 whitespace-normal">
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link to={`/staffing/assignments/${assignment.assignment_id}/edit`} />
                      }
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteError(null);
                        setAssignmentToDelete(assignment);
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
          open={assignmentToDelete !== null}
          title="Видалити призначення"
          description={`Призначення "${[assignmentToDelete?.employee?.last_name, assignmentToDelete?.employee?.first_name, assignmentToDelete?.employee?.patronymic].filter(Boolean).join(" ")}" буде видалено`}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            setAssignmentToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      </section>
    </>
  );
};

export default AssignmentsPage;
