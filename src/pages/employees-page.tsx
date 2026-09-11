import SiteHeader from "@/components/site-header";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router";
import { TablePagination } from "@/components/table-pagination";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

type Employee = {
  employee_id: string;
  last_name: string;
  first_name: string;
  patronymic: string | null;
  tax_number: string;
  birth_date: string;
};

type SortColumn = "last_name" | "first_name" | "patronymic" | "tax_number" | "birth_date";

const PAGE_SIZE = 20;

const columns: { key: SortColumn; label: string }[] = [
  { key: "last_name", label: "Прізвище" },
  { key: "first_name", label: "Ім'я" },
  { key: "patronymic", label: "По батькові" },
  { key: "tax_number", label: "РНОКПП" },
  { key: "birth_date", label: "Дата народження" },
];

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [sort, setSort] = useState<{
    column: SortColumn;
    ascending: boolean;
  }>({
    column: "last_name",
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

    async function loadEmployees() {
      setLoading(true);
      setError(null);

      try {
        const from = page * PAGE_SIZE;

        const { data, count, error } = await supabase
          .from("employees")
          .select("employee_id, last_name, first_name, patronymic, tax_number, birth_date", {
            count: "exact",
          })
          .order(sort.column, { ascending: sort.ascending })
          .order("employee_id", { ascending: true })
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
        setEmployees(data ?? []);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Не вдалося завантажити працівників");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [page, sort.column, sort.ascending, refreshKey]);

  async function handleDelete() {
    if (!employeeToDelete || deleting) return;

    const id = employeeToDelete.employee_id;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("employee_id", id)
        .select("employee_id")
        .single();

      if (error) {
        setDeleteError("Помилка видалення працівника");

        return;
      }

      setRefreshKey((current) => current + 1);
      setEmployeeToDelete(null);
    } catch {
      setDeleteError("Не вдалося виконати видалення");
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <SiteHeader title="Працівники" loading={loading}>
        <Button nativeButton={false} render={<Link to="/staffing/employees/new" />}>
          Додати працівника
        </Button>
      </SiteHeader>
      <section className="space-y-6">
        {loading ? (
          <p role="status">Завантаження...</p>
        ) : error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : employees.length === 0 ? (
          <p className="text-muted-foreground">Працівників поки немає.</p>
        ) : (
          <Table>
            <TableCaption>Працівники</TableCaption>
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
              {employees.map((employee) => (
                <TableRow key={employee.employee_id}>
                  <TableCell className="whitespace-normal">{employee.last_name}</TableCell>
                  <TableCell className="whitespace-normal">{employee.first_name}</TableCell>
                  <TableCell className="whitespace-normal">{employee.patronymic}</TableCell>
                  <TableCell className="whitespace-normal">{employee.tax_number}</TableCell>
                  <TableCell className="whitespace-normal">{employee.birth_date}</TableCell>
                  <TableCell className="space-x-2 whitespace-normal">
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<Link to={`/staffing/employees/${employee.employee_id}/edit`} />}
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteError(null);
                        setEmployeeToDelete(employee);
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
          open={employeeToDelete !== null}
          title="Видалити працівника"
          description={`Працівника "${employeeToDelete?.last_name ?? ""} ${employeeToDelete?.first_name ?? ""}" буде видалено`}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            setEmployeeToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      </section>
    </>
  );
};

export default EmployeesPage;
