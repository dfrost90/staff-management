import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import { TablePagination } from "@/components/table-pagination";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import SiteHeader from "@/components/site-header";

const PAGE_SIZE = 20;

type Job = {
  job_id: string;
  title: string;
};

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [sortAsc, setSortAsc] = useState(true);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSort() {
    setPage(0);
    setSortAsc((current) => !current);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError(null);

      try {
        const from = page * PAGE_SIZE;

        const { data, count, error } = await supabase
          .from("jobs")
          .select("job_id, title", { count: "exact" })
          .order("title", { ascending: sortAsc })
          .order("job_id", { ascending: true })
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
        setJobs(data ?? []);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Не вдалося завантажити посади");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [page, sortAsc, refreshKey]);

  async function handleDelete() {
    if (!jobToDelete || deleting) return;

    const id = jobToDelete.job_id;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("job_id", id)
        .select("job_id")
        .single();

      if (error) {
        setDeleteError("Помилка видалення посади");

        return;
      }

      setJobs((current) => {
        return current.filter((job) => job.job_id !== id);
      });

      setRefreshKey((current) => current + 1);
      setJobToDelete(null);
    } catch {
      setDeleteError("Не вдалося виконати видалення");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SiteHeader title="Посади" loading={loading}>
        <Button nativeButton={false} render={<Link to="/jobs/new" />}>
          Додати посаду
        </Button>
      </SiteHeader>
      <section className="space-y-6">
        {loading ? (
          <p role="status">Завантаження...</p>
        ) : error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground">Посад поки немає.</p>
        ) : (
          <Table>
            <TableCaption>Довідник посад підприємства</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={handleSort}>
                    Посада
                    <span>{sortAsc ? "↑" : "↓"}</span>
                  </Button>
                </TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.job_id}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<Link to={`/jobs/${job.job_id}/edit`} />}
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteError(null);
                        setJobToDelete(job);
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

        <Button nativeButton={false} render={<Link to="/jobs/new" />}>
          Додати посаду
        </Button>

        <DeleteConfirmationDialog
          open={jobToDelete !== null}
          title="Видалити посаду"
          description={`Посаду "${jobToDelete?.title ?? ""}" буде видалено`}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            setJobToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      </section>
    </>
  );
};

export default JobsPage;
