import type { SubmitEvent } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Spinner } from "./ui/spinner";

type DepartmentsFormProps = {
  departmentId?: string;
};

const DepartmentsForm = ({ departmentId }: DepartmentsFormProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [loading, setLoading] = useState(Boolean(departmentId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentId) return;

    let cancelled = false;

    async function loadDepartment() {
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("name, short_name")
          .eq("department_id", departmentId)
          .single();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setName(data.name);
          setShortName(data.short_name);
        }
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити підрозділ");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDepartment();

    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaveError(null);

    const values = {
      name: name.trim(),
      short_name: shortName.trim(),
    };

    if (!values.name || !values.short_name) {
      setSaveError("Заповніть поля");
      return;
    }

    // same as db
    // if ([...values.short_name].length >= [...values.name].length) {
    if (values.short_name.length >= values.name.length) {
      setSaveError("Скорочена назва має бути коротшою за повну");
      return;
    }

    setSaving(true);

    try {
      const [nameCheck, shortNameCheck] = await Promise.all([
        supabase.from("departments").select("department_id").eq("name", values.name),
        supabase.from("departments").select("department_id").eq("short_name", values.short_name),
      ]);

      if (nameCheck.error) {
        throw nameCheck.error;
      }

      if (shortNameCheck.error) {
        throw shortNameCheck.error;
      }

      if (
        nameCheck.data.some((row) => row.department_id !== departmentId) ||
        shortNameCheck.data.some((row) => row.department_id !== departmentId)
      ) {
        setSaveError("Підрозділ з такою назвою або скороченням вже існує");
        return;
      }

      const query = departmentId
        ? supabase.from("departments").update(values).eq("department_id", departmentId)
        : supabase.from("departments").insert(values);

      const { error } = await query.select("department_id").single();

      if (error) {
        setSaveError("Не вдалося зберегти.");

        return;
      }

      navigate("/departments");
    } catch {
      setSaveError("Не вдалося виконати запит.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p role="status">
        <Spinner /> Завантаження...
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <Link to="/departments">Повернутися до підрозділів</Link>
      </div>
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      {departmentId && (
        <Field className="space-y-2">
          <Label htmlFor="department-id">ID</Label>
          <Input id="department-id" value={departmentId} readOnly />
        </Field>
      )}
      <FieldGroup>
        <Field>
          <Label htmlFor="department-name">Назва</Label>
          <Input
            id="department-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={saving}
          />
        </Field>
        <Field>
          <Label htmlFor="department-short-name">Скорочена назва</Label>
          <Input
            id="department-short-name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
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
        <Button variant="outline" nativeButton={false} render={<Link to="/departments" />}>
          Скасувати
        </Button>
      </div>
    </form>
  );
};

export default DepartmentsForm;
