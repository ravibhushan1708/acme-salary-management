import { Select, Table, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type EmployeePage, type Meta } from "../api";
import { formatCount, formatMoney } from "../format";

export function PeoplePage() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [result, setResult] = useState<EmployeePage | null>(null);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [error, setError] = useState<string | null>(null);

  const page = Number(params.get("page") ?? "1");
  const country = params.get("country") ?? "";
  const department = params.get("department") ?? "";
  const jobLevel = params.get("jobLevel") ?? "";
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";

  useEffect(() => {
    api<Meta>("/api/meta")
      .then(setMeta)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load filters"));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (country) query.set("country", country);
    if (department) query.set("department", department);
    if (jobLevel) query.set("jobLevel", jobLevel);
    if (status) query.set("status", status);
    query.set("page", String(page));
    query.set("pageSize", "20");
    let cancelled = false;
    api<EmployeePage>(`/api/employees?${query.toString()}`)
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load people");
      });
    return () => {
      cancelled = true;
    };
  }, [q, country, department, jobLevel, status, page]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (search) next.set("q", search);
        else next.delete("q");
        if ((current.get("q") ?? "") !== search) next.set("page", "1");
        return next;
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [search, setParams]);

  function setFilter(key: string, value: string | null) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set("page", "1");
      return next;
    });
  }

  function setPage(nextPage: number) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(nextPage));
      return next;
    });
  }

  const from = result && result.total > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  const to = result ? Math.min(result.total, result.page * result.pageSize) : 0;

  return (
    <>
      <p className="page-kicker">Directory</p>
      <div className="page-head">
        <h1 className="page-title">People</h1>
        <a className="quiet" href="/api/export/employees.csv">
          Export CSV
        </a>
      </div>
      <p className="lede">Find someone and open their salary. The list stays paged so 10,000 rows never land in the browser at once.</p>
      {error ? <p role="alert">{error}</p> : null}
      <div className="filters">
        <TextInput
          label="Search"
          placeholder="Name, email, or employee number"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Select
          label="Country"
          placeholder="All"
          clearable
          data={meta?.countries.map((entry) => entry.country) ?? []}
          value={country || null}
          onChange={(value) => setFilter("country", value)}
        />
        <Select
          label="Department"
          placeholder="All"
          clearable
          data={meta?.departments ?? []}
          value={department || null}
          onChange={(value) => setFilter("department", value)}
        />
        <Select
          label="Level"
          placeholder="All"
          clearable
          data={meta?.jobLevels ?? []}
          value={jobLevel || null}
          onChange={(value) => setFilter("jobLevel", value)}
        />
        <Select
          label="Status"
          placeholder="All"
          clearable
          data={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
          value={status || null}
          onChange={(value) => setFilter("status", value)}
        />
      </div>
      <div className="card">
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Country</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Annual salary</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {result?.items.map((person) => (
              <Table.Tr key={person.id}>
                <Table.Td>
                  <Link to={`/people/${person.id}`}>
                    {person.firstName} {person.lastName}
                  </Link>
                  <div className="muted">{person.employeeNumber}</div>
                </Table.Td>
                <Table.Td>
                  {person.jobTitle}
                  <div className="muted">{person.department}</div>
                </Table.Td>
                <Table.Td>{person.country}</Table.Td>
                <Table.Td>{person.status === "ACTIVE" ? "Active" : "Inactive"}</Table.Td>
                <Table.Td style={{ textAlign: "right" }} className="amount">
                  {formatMoney(person.annualSalary, person.currency)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <div className="pager">
          <span>
            {result ? `${formatCount(from)}–${formatCount(to)} of ${formatCount(result.total)}` : "Loading…"}
          </span>
          <span>
            <button
              type="button"
              disabled={!result || result.page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>{" "}
            <button
              type="button"
              disabled={!result || result.page * result.pageSize >= result.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </span>
        </div>
      </div>
    </>
  );
}
