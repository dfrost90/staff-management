import type { SubmitEvent } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EmployeesFormProps = {
  employeeId?: string;
};

const EmployeesForm = ({ employeeId }: EmployeesFormProps) => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [loading, setLoading] = useState(Boolean(employeeId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;

    let cancelled = false;

    async function loadEmployee() {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("last_name, first_name, patronymic, tax_number, birth_date")
          .eq("employee_id", employeeId)
          .single();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setFirstName(data.first_name);
          setLastName(data.last_name);
          setPatronymic(data.patronymic ?? "");
          setTaxNumber(data.tax_number);
          setBirthDate(data.birth_date);
        }
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити працівника");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaveError(null);

    const values = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      patronymic: patronymic.trim() || null,
      tax_number: taxNumber.trim(),
      birth_date: birthDate.trim(),
    };

    if (!values.first_name || !values.last_name || !values.tax_number || !values.birth_date) {
      setSaveError("Заповніть поля");
      return;
    }

    setSaving(true);

    try {
      const taxNumberCheck = await supabase
        .from("employees")
        .select("employee_id")
        .eq("tax_number", values.tax_number);

      if (taxNumberCheck.error) {
        throw taxNumberCheck.error;
      }

      if (taxNumberCheck.data.some((row) => row.employee_id !== employeeId)) {
        setSaveError("Працівник з таким РНОКПП вже існує");
        return;
      }

      const query = employeeId
        ? supabase.from("employees").update(values).eq("employee_id", employeeId)
        : supabase.from("employees").insert(values);

      const { error } = await query.select("employee_id").single();

      if (error) {
        setSaveError("Не вдалося зберегти.");

        return;
      }

      navigate("/staffing/employees");
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
        <Link to="/staffing/employees">Повернутися до праціваників</Link>
      </div>
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      {employeeId && (
        <Field>
          <Label htmlFor="employee-id">ID</Label>
          <Input id="employee-id" value={employeeId} readOnly />
        </Field>
      )}

      <FieldGroup>
        <Field>
          <Label htmlFor="last-name">Прізвище</Label>
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={saving}
          />
        </Field>

        <Field>
          <Label htmlFor="first-name">Ім’я</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={saving}
          />
        </Field>

        <Field>
          <Label htmlFor="patronymic">По батькові (необов’язково)</Label>
          <Input
            id="patronymic"
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
            disabled={saving}
          />
        </Field>

        <Field>
          <Label htmlFor="tax-number">РНОКПП</Label>
          <Input
            id="tax-number"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            required
            disabled={saving}
          />
        </Field>

        <Field>
          <Label htmlFor="birth-date">Дата народження</Label>
          <Input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
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
        <Button variant="outline" nativeButton={false} render={<Link to="/staffing/employees" />}>
          Скасувати
        </Button>
      </div>
    </form>
  );
};

export default EmployeesForm;
