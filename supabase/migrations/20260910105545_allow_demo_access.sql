GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments, public.jobs, public.employees, public.assignments, public.leave_requests TO anon;

CREATE POLICY demo_access ON public.departments
    FOR ALL TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY demo_access ON public.jobs
    FOR ALL TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY demo_access ON public.employees
    FOR ALL TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY demo_access ON public.assignments
    FOR ALL TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY demo_access ON public.leave_requests
    FOR ALL TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

