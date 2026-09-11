export type AssignmentLabelData = {
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
    short_name: string;
  } | null;
};

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export function formatAssignment(assignment: AssignmentLabelData): string {
  const employee = assignment.employee;

  const employeeName = employee
    ? [
        employee.last_name,
        `${[...employee.first_name][0] ?? ""}.`,
        employee.patronymic ? `${[...employee.patronymic][0]}.` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "-";

  const dates = assignment.end_date
    ? `${formatDate(assignment.start_date)} - ${formatDate(assignment.end_date)}`
    : formatDate(assignment.start_date);

  return `${employeeName} - ${assignment.job?.title ?? "-"} - ${assignment.department?.short_name ?? "-"} [${dates}]`;
}
