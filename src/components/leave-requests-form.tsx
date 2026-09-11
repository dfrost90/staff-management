import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { supabase } from "@/lib/supabase";
import { formatAssignment, type AssignmentLabelData } from "@/lib/format-assignment";

type LeaveRequestsFormProps = {
  leaveId?: string;
};

type AssignmentOption = AssignmentLabelData & {
  assignment_id: string;
  department_id: string;
};

const LeaveRequestsForm = ({ leaveId }: LeaveRequestsFormProps) => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);

  const [assignmentId, setAssignmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingLeaveRequest, setLoadingLeaveRequest] = useState(Boolean(leaveId));
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignments() {
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select(`
            assignment_id,
            department_id,
            start_date,
            end_date,
            employee:employees(last_name, first_name, patronymic),
            job:jobs(title),
            department:departments(short_name)
          `)
          .order("start_date", { ascending: false })
          .order("assignment_id", { ascending: true })
          .overrideTypes<AssignmentOption[], { merge: false }>();

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setAssignments(data ?? []);
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити Призначення");
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
  }, []);

  useEffect(() => {
    if (!leaveId) return;

    let cancelled = false;

    async function loadLeaveRequest() {
      try {
        const { data, error } = await supabase
          .from("leave_requests")
          .select("assignment_id, start_date, end_date")
          .eq("leave_id", leaveId)
          .single();

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setAssignmentId(data.assignment_id);
        setStartDate(data.start_date);
        setEndDate(data.end_date);
      } catch {
        if (!cancelled) {
          setError("Не вдалося завантажити заявку на відпустку");
        }
      } finally {
        if (!cancelled) {
          setLoadingLeaveRequest(false);
        }
      }
    }

    void loadLeaveRequest();

    return () => {
      cancelled = true;
    };
  }, [leaveId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaveError(null);

    if (!assignmentId || !startDate || !endDate) {
      setSaveError("Заповніть обов'язкові поля");
      return;
    }

    if (endDate < startDate) {
      setSaveError("Завершення відпустки не може передувати її початку");
      return;
    }

    setSaving(true);

    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .select("department_id, start_date, end_date")
        .eq("assignment_id", assignmentId)
        .single();

      if (assignmentError) {
        throw assignmentError;
      }

      if (
        startDate < assignment.start_date ||
        (assignment.end_date && startDate > assignment.end_date)
      ) {
        setSaveError("Початок відпустки має бути в межах періоду призначення");
        return;
      }

      let overlapQuery = supabase
        .from("leave_requests")
        .select("leave_id, assignment:assignments!inner(department_id)")
        .eq("assignment.department_id", assignment.department_id)
        .lte("start_date", endDate)
        .gte("end_date", startDate);

      if (leaveId) {
        overlapQuery = overlapQuery.neq("leave_id", leaveId);
      }

      const { data: overlaps, error: overlapError } = await overlapQuery.limit(1);

      if (overlapError) {
        throw overlapError;
      }

      if (overlaps.length > 0) {
        setSaveError("У цьому підрозділі вже є заявка на відпустку за період, що перетинається");
        return;
      }

      const values = {
        assignment_id: assignmentId,
        start_date: startDate,
        end_date: endDate,
      };

      const query = leaveId
        ? supabase.from("leave_requests").update(values).eq("leave_id", leaveId)
        : supabase.from("leave_requests").insert(values);

      const { error } = await query.select("leave_id").single();

      if (error) {
        if (error.message === "Leave overlaps an existing request in this department") {
          setSaveError("Період відпустки перетинається з іншою заявкою підрозділу");
        } else if (error.message === "Leave must start within the assignment period") {
          setSaveError("Початок відпустки має бути в межах періоду призначення");
        } else {
          setSaveError("Не вдалося зберегти заявку на відпустку");
        }
        return;
      }

      navigate("/staffing/leave-requests");
    } catch {
      setSaveError("Не вдалося виконати запит");
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingLeaveRequest) {
    return <p role="status">Завантаження...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <Link to="/staffing/leave-requests">Повернутися до заявок на відпустку</Link>
      </div>
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit} noValidate>
      {leaveId && (
        <Field>
          <Label htmlFor="leave-id">ID</Label>
          <Input id="leave-id" value={leaveId} readOnly />
        </Field>
      )}

      <FieldGroup>
        <Field>
          <Label htmlFor="assignment-id">Призначення</Label>
          <NativeSelect
            id="assignment-id"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            disabled={saving}
            required
          >
            <NativeSelectOption value="" disabled>
              Оберіть Призначення
            </NativeSelectOption>
            {assignments.map((assignment) => (
              <NativeSelectOption key={assignment.assignment_id} value={assignment.assignment_id}>
                {formatAssignment(assignment)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <Label htmlFor="start-date">Початок відпустки</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="end-date">Завершення відпустки</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            required
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
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/staffing/leave-requests" />}
        >
          Скасувати
        </Button>
      </div>
    </form>
  );
};

export default LeaveRequestsForm;
