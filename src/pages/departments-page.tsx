import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TablePagination } from "@/components/table-pagination";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

const PAGE_SIZE = 20;

type SortColumn = "name" | "short_name";

type Department = {
  department_id: string;
  name: string;
  short_name: string;
};

const columns: { key: SortColumn; label: string }[] = [
  { key: "name", label: "Назва підрозділу" },
  { key: "short_name", label: "Коротка назва підрозділу" },
];

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sort, setSort] = useState<{
    column: SortColumn;
    ascending: boolean;
  }>({
    column: "name",
    ascending: true,
  });

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

    async function loadDepartments() {
      setLoading(true);
      setError(null);

      try {
        const from = page * PAGE_SIZE;

        const { data, count, error } = await supabase
          .from("departments")
          .select("department_id, name, short_name", { count: "exact" })
          .order(sort.column, { ascending: sort.ascending })
          .order("department_id", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

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
        setDepartments(data ?? []);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Не вдалося завантажити підрозділи");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [page, sort.column, sort.ascending, refreshKey]);

  async function handleDelete() {
    if (!departmentToDelete || deleting) return;

    const id = departmentToDelete.department_id;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("department_id", id)
        .select("department_id")
        .single();

      if (error) {
        setDeleteError("Помилка видалення підрозділу");

        return;
      }

      setDepartments((current) => {
        return current.filter((department) => department.department_id !== id);
      });

      setRefreshKey((current) => current + 1);
      setDepartmentToDelete(null);
    } catch {
      setDeleteError("Не вдалося виконати видалення");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Підрозділи</h1>

      {loading ? (
        <p role="status">
          <Spinner /> Завантаження...
        </p>
      ) : error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : departments.length === 0 ? (
        <p className="text-muted-foreground">Підрозділів поки немає.</p>
      ) : (
        <Table>
          <TableCaption>Довідник підрозділів підприємства</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
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
            {departments.map((department) => (
              <TableRow key={department.department_id}>
                <TableCell>{department.name}</TableCell>
                <TableCell>{department.short_name}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link to={`/departments/${department.department_id}/edit`} />}
                  >
                    Редагувати
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteError(null);
                      setDepartmentToDelete(department);
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

      <Button nativeButton={false} render={<Link to="/departments/new" />}>
        Додати підрозділ
      </Button>

      <DeleteConfirmationDialog
        open={departmentToDelete !== null}
        title="Видалити підрозділ"
        description={`Підрозділ "${departmentToDelete?.name ?? ""}" буде видалено`}
        deleting={deleting}
        error={deleteError}
        onCancel={() => {
          setDepartmentToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
};

export default DepartmentsPage;
