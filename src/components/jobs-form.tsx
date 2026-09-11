import type { SubmitEvent } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type JobsFormProps = {
  jobId?: string;
};

const JobsForm = ({ jobId }: JobsFormProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function loadJob() {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("title")
          .eq("job_id", jobId)
          .single();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setTitle(data.title);
        }
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити посаду");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaveError(null);

    const values = {
      title: title.trim(),
    };

    if (!values.title) {
      setSaveError("Заповніть поля");
      return;
    }

    setSaving(true);

    try {
      const titleCheck = await supabase.from("jobs").select("job_id").eq("title", values.title);

      if (titleCheck.error) {
        throw titleCheck.error;
      }

      if (titleCheck.data.some((row) => row.job_id !== jobId)) {
        setSaveError("Посада з такою назвою або скороченням вже існує");
        return;
      }

      const query = jobId
        ? supabase.from("jobs").update(values).eq("job_id", jobId)
        : supabase.from("jobs").insert(values);

      const { error } = await query.select("job_id").single();

      if (error) {
        setSaveError("Не вдалося зберегти.");

        return;
      }

      navigate("/jobs");
    } catch {
      setSaveError("Не вдалося виконати запит.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p role="status">Завантаження...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <Link to="/jobs">Повернутися до посад</Link>
      </div>
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      {jobId && (
        <Field className="space-y-2">
          <Label htmlFor="department-id">ID</Label>
          <Input id="department-id" value={jobId} readOnly />
        </Field>
      )}
      <FieldGroup>
        <Field>
          <Label htmlFor="department-name">Назва посади</Label>
          <Input
            id="department-name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />
        </Field>
      </FieldGroup>
      {saveError && (
        <p role="alert" className="text-destructive">
          {saveError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Збереження..." : "Зберегти"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link to="/jobs" />}>
          Скасувати
        </Button>
      </div>
    </form>
  );
};

export default JobsForm;
