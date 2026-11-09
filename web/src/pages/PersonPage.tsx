import { Button, Select, TextInput } from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api, type EmployeeDetail, type Meta } from "../api";
import { formatMoney, formatWhen } from "../format";

export function PersonPage() {
  const { id } = useParams();
  const [person, setPerson] = useState<EmployeeDetail | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [salary, setSalary] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function apply(next: EmployeeDetail) {
    setPerson(next);
    setSalary(next.annualSalary);
    setDepartment(next.department);
    setJobTitle(next.jobTitle);
    setJobLevel(next.jobLevel);
    setStatus(next.status);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([api<EmployeeDetail>(`/api/employees/${id}`), api<Meta>("/api/meta")])
      .then(([nextPerson, nextMeta]) => {
        if (cancelled) return;
        apply(nextPerson);
        setMeta(nextMeta);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load this person");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!person) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/api/employees/${person.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          annualSalary: salary,
          department,
          jobTitle,
          jobLevel,
          status,
        }),
      });
      const next = await api<EmployeeDetail>(`/api/employees/${person.id}`);
      apply(next);
      setNotice("Saved. A revision is recorded only when the salary amount changes.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (error && !person) return <p role="alert">{error}</p>;
  if (!person || !meta) return <p>Loading…</p>;

  return (
    <>
      <p className="page-kicker">
        <Link className="quiet" to="/people">
          People
        </Link>
      </p>
      <h1 className="page-title">
        {person.firstName} {person.lastName}
      </h1>
      <p className="lede">
        {person.employeeNumber} · {person.email} · {person.country} · {person.currency}
      </p>
      <div className="person-layout">
        <form className="card" onSubmit={(event) => void onSubmit(event)}>
          <h2>Annual base salary</h2>
          <p className="stat-value amount">{formatMoney(person.annualSalary, person.currency)}</p>
          <TextInput
            label={`New annual salary (${person.currency})`}
            description="Stored in local currency. Country and currency stay as they are."
            value={salary}
            onChange={(event) => setSalary(event.currentTarget.value)}
            inputMode="decimal"
            mt="md"
            required
          />
          <Select
            label="Department"
            data={meta.departments}
            value={department}
            onChange={(value) => setDepartment(value ?? department)}
            allowDeselect={false}
            mt="sm"
          />
          <TextInput
            label="Job title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.currentTarget.value)}
            mt="sm"
            required
          />
          <Select
            label="Level"
            data={meta.jobLevels}
            value={jobLevel}
            onChange={(value) => setJobLevel(value ?? jobLevel)}
            allowDeselect={false}
            mt="sm"
          />
          <Select
            label="Status"
            data={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            value={status}
            onChange={(value) => setStatus(value ?? status)}
            allowDeselect={false}
            mt="sm"
            mb="md"
          />
          {error ? <p role="alert">{error}</p> : null}
          {notice ? <p>{notice}</p> : null}
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
        <section className="card">
          <h2>Salary revisions</h2>
          {person.revisions.length === 0 ? (
            <p className="muted">No salary changes have been recorded yet.</p>
          ) : (
            <ol>
              {person.revisions.map((revision) => (
                <li key={revision.id}>
                  <span className="amount">
                    {formatMoney(revision.previousSalary, revision.currency)} →{" "}
                    {formatMoney(revision.newSalary, revision.currency)}
                  </span>
                  <div className="muted">{formatWhen(revision.createdAt)}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
