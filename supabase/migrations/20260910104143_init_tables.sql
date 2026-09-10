CREATE EXTENSION IF NOT EXISTS btree_gist;

SET search_path TO public, extensions;

CREATE TABLE public.departments (
    department_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name text NOT NULL UNIQUE,
    short_name text NOT NULL UNIQUE,
    CONSTRAINT short_name_length CHECK (char_length(short_name) < char_length(name))
);

CREATE TABLE public.jobs (
    job_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    title text NOT NULL UNIQUE
);

CREATE TABLE public.employees (
    employee_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    last_name text NOT NULL,
    first_name text NOT NULL,
    patronymic text,
    tax_number text UNIQUE NOT NULL,
    birth_date date NOT NULL
);

CREATE TABLE public.assignments (
    assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    employee_id uuid REFERENCES public.employees (employee_id) NOT NULL,
    job_id uuid REFERENCES public.jobs (job_id) NOT NULL,
    department_id uuid REFERENCES public.departments (department_id) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    CONSTRAINT assignments_valid_date CHECK (end_date >= start_date),
    CONSTRAINT assignments_no_overlap
    EXCLUDE USING gist (employee_id WITH =, job_id WITH =, department_id WITH =, daterange(start_date, end_date, '[]'
) WITH &&)
);

CREATE TABLE public.leave_requests (
    leave_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    assignment_id uuid NOT NULL REFERENCES public.assignments (assignment_id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    CONSTRAINT leave_valid_date CHECK (end_date >= start_date)
);

CREATE OR REPLACE FUNCTION public.validate_leave_request ()
    RETURNS TRIGGER
    AS $$
DECLARE
    current_assignment public.assignments % rowtype;
BEGIN
    SELECT
        a.*
    INTO
        current_assignment
    FROM
        public.assignments AS a
    WHERE
        a.assignment_id = NEW.assignment_id FOR SHARE;
    IF NOT found THEN
        RAISE EXCEPTION 'Assignment does not exist';
    END IF;
    IF NEW.start_date < current_assignment.start_date OR (current_assignment.end_date IS NOT NULL AND NEW.start_date > current_assignment.end_date) THEN
        RAISE EXCEPTION 'Leave must start within the assignment period';
    END IF;
    PERFORM
        d.department_id
    FROM
        public.departments AS d
    WHERE
        d.department_id = current_assignment.department_id
    FOR UPDATE;
    IF EXISTS (
        SELECT
            1
        FROM
            public.leave_requests AS lr
            JOIN public.assignments AS a ON a.assignment_id = lr.assignment_id
        WHERE
            a.department_id = current_assignment.department_id
            AND lr.leave_id <> NEW.leave_id
            AND lr.start_date <= NEW.end_date
            AND lr.end_date >= NEW.start_date) THEN
    RAISE EXCEPTION 'Leave overlaps an existing request in this department';
END IF;
    RETURN new;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER validate_leave_request
    BEFORE INSERT OR UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_leave_request ();

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

ALTER FUNCTION public.validate_leave_request () SET search_path = '';

