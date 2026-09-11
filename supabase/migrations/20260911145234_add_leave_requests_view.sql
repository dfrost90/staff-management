CREATE VIEW public.leave_requests_view WITH ( security_invoker = TRUE
) AS
SELECT
    lr.leave_id,
    lr.assignment_id,
    lr.start_date,
    lr.end_date,
    e.last_name AS employee_last_name
FROM
    public.leave_requests AS lr
    JOIN public.assignments AS a ON a.assignment_id = lr.assignment_id
    JOIN public.employees AS e ON e.employee_id = a.employee_id;

GRANT SELECT ON public.leave_requests_view TO anon;

