import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { supabase } from "@/lib/supabase";

type AssignmentsFormProps = {
  assignmentId?: string;
};

type EmployeeOption = {
  employee_id: string;
  last_name: string;
  first_name: string;
  patronymic: string | null;
};

type JobOption = {
  job_id: string;
  title: string;
};

type DepartmentOption = {
  department_id: string;
  name: string;
};

const AssignmentsForm = ({ assignmentId }: AssignmentsFormProps) => {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAssignment, setLoadingAssignment] = useState(Boolean(assignmentId));
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [employeesResult, jobsResult, departmentsResult] = await Promise.all([
          supabase
            .from("employees")
            .select("employee_id, last_name, first_name, patronymic")
            .order("last_name")
            .order("first_name")
            .order("employee_id"),
          supabase.from("jobs").select("job_id, title").order("title"),
          supabase.from("departments").select("department_id, name").order("name"),
        ]);

        if (employeesResult.error) {
          throw employeesResult.error;
        }
        if (jobsResult.error) {
          throw jobsResult.error;
        }
        if (departmentsResult.error) {
          throw departmentsResult.error;
        }

        if (cancelled) {
          return;
        }

        setEmployees(employeesResult.data ?? []);
        setJobs(jobsResult.data ?? []);
        setDepartments(departmentsResult.data ?? []);
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити списки");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;

    async function loadAssignment() {
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("employee_id, job_id, department_id, start_date, end_date")
          .eq("assignment_id", assignmentId)
          .single();

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setEmployeeId(data.employee_id);
        setJobId(data.job_id);
        setDepartmentId(data.department_id);
        setStartDate(data.start_date);
        setEndDate(data.end_date ?? "");
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити призначення");
        }
      } finally {
        if (!cancelled) {
          setLoadingAssignment(false);
        }
      }
    }

    void loadAssignment();

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    setSaveError(null);

    if (!employeeId || !jobId || !departmentId || !startDate) {
      setSaveError("Заповніть обов’язкові поля");
      return;
    }

    if (endDate && endDate < startDate) {
      setSaveError("Дата завершення не може передувати даті початку");
      return;
    }

    const values = {
      employee_id: employeeId,
      job_id: jobId,
      department_id: departmentId,
      start_date: startDate,
      end_date: endDate || null,
    };

    setSaving(true);

    try {
      let overlapQuery = supabase
        .from("assignments")
        .select("assignment_id")
        .eq("employee_id", employeeId)
        .eq("job_id", jobId)
        .eq("department_id", departmentId)
        .or(`end_date.is.null, end_date.gte.${startDate}`);

      if (endDate) {
        overlapQuery = overlapQuery.lte("start_date", endDate);
      }

      if (assignmentId) {
        overlapQuery = overlapQuery.neq("assignment_id", assignmentId);
      }

      const { data: overlaps, error: overlapError } = await overlapQuery.limit(1);

      if (overlapError) {
        throw overlapError;
      }

      if (overlaps.length > 0) {
        setSaveError(
          "Працівник уже має призначення на цю посаду в цьому підрозділі за період, що перетинається",
        );

        return;
      }

      const query = assignmentId
        ? supabase.from("assignments").update(values).eq("assignment_id", assignmentId)
        : supabase.from("assignments").insert(values);

      const { error } = await query.select("assignment_id").single();

      if (error) {
        setSaveError("Не вдалося зберегти призначення");

        return;
      }

      navigate("/staffing/assignments");
    } catch {
      setSaveError("Не вдалося виконати запит");
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingAssignment) {
    return <p role="status">Завантаження...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <Link to="/staffing/assignments">Повернутися до призначень</Link>
      </div>
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      {assignmentId && (
        <Field>
          <Label htmlFor="assignment-id">ID</Label>
          <Input id="assignment-id" value={assignmentId} readOnly />
        </Field>
      )}

      <FieldGroup>
        <Field>
          <Label htmlFor="employee-id">Працівник</Label>
          <NativeSelect
            id="employee-id"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              Оберіть працівника
            </NativeSelectOption>
            {employees.map((employee) => (
              <NativeSelectOption key={employee.employee_id} value={employee.employee_id}>
                {[employee.last_name, employee.first_name, employee.patronymic]
                  .filter(Boolean)
                  .join(" ")}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <Label htmlFor="job-id">Посада</Label>
          <NativeSelect
            id="job-id"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              Оберіть посаду
            </NativeSelectOption>
            {jobs.map((job) => (
              <NativeSelectOption key={job.job_id} value={job.job_id}>
                {job.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <Label htmlFor="department-id">Підрозділ</Label>
          <NativeSelect
            id="department-id"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              Оберіть підрозділ
            </NativeSelectOption>
            {departments.map((department) => (
              <NativeSelectOption key={department.department_id} value={department.department_id}>
                {department.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <Label htmlFor="start-date">Дата початку</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="end-date">Дата завершення (необов'язково)</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
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
        <Button variant="outline" nativeButton={false} render={<Link to="/staffing/assignments" />}>
          Скасувати
        </Button>
      </div>
    </form>
  );
};

export default AssignmentsForm;
