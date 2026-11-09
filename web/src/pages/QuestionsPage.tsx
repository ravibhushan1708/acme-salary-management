import { Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CountryExtremes, type Insights, type Meta } from "../api";
import { barPercent, formatCount, formatDate, formatMoney, formatUsd } from "../format";

export function QuestionsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [country, setCountry] = useState("United States");
  const [extremes, setExtremes] = useState<CountryExtremes | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api<Insights>("/api/insights"), api<Meta>("/api/meta")])
      .then(([nextInsights, nextMeta]) => {
        if (cancelled) return;
        setInsights(nextInsights);
        setMeta(nextMeta);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load pay questions");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    api<CountryExtremes>(`/api/insights/country/${encodeURIComponent(country)}`)
      .then((next) => {
        if (!cancelled) setExtremes(next);
      })
      .catch(() => {
        if (!cancelled) setExtremes(null);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  if (error) return <p role="alert">{error}</p>;
  if (!insights || !meta) return <p>Loading pay questions…</p>;

  const rateDate = formatDate(insights.fxAsOf);
  const maxHeadcount = Math.max(...insights.headcountByCountry.map((row) => row.count));
  const maxPayroll = maxAmount(insights.payrollUsdByCountry.map((row) => row.totalUsd));
  const maxDepartment = maxAmount(insights.departmentTotals.map((row) => row.totalUsd));

  return (
    <>
      <p className="page-kicker">How ACME pays</p>
      <h1 className="page-title">Pay questions</h1>
      <p className="lede">
        Active employees only. Amounts in USD are a comparison using the rate snapshot from {rateDate}.
        They are not amounts to pay.
      </p>

      <section className="stat-grid">
        <article className="card">
          <p className="stat-label">Active people</p>
          <p className="stat-value amount">{formatCount(insights.headcount)}</p>
        </article>
        <article className="card">
          <p className="stat-label">Annual payroll, USD comparison</p>
          <p className="stat-value amount">{formatUsd(insights.payrollUsd)}</p>
          <p className="stat-note">Rates as of {rateDate}</p>
        </article>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>How many people do we employ, and in which countries?</h2>
        {insights.headcountByCountry.map((row) => (
          <div className="bar-row" key={row.country}>
            <Link className="quiet" to={`/people?country=${encodeURIComponent(row.country)}`}>
              {row.country}
            </Link>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${(row.count / maxHeadcount) * 100}%` }} />
            </div>
            <span className="amount">{formatCount(row.count)}</span>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>What is annual payroll in each local currency?</h2>
        {insights.payrollByCurrency.map((row) => (
          <div className="bar-row" key={row.currency}>
            <span>{row.currency}</span>
            <span className="muted">{formatCount(row.headcount)} people</span>
            <strong className="amount">{formatMoney(row.total, row.currency)}</strong>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>What is that payroll worth in USD?</h2>
        <p className="stat-note">Comparison only, using rates from {rateDate}.</p>
        {insights.payrollUsdByCountry.map((row) => (
          <div className="bar-row" key={row.country}>
            <span>
              {row.country} <span className="muted">{row.currency}</span>
            </span>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: barPercent(row.totalUsd, maxPayroll) }} />
            </div>
            <strong className="amount">{formatUsd(row.totalUsd)}</strong>
          </div>
        ))}
        <details style={{ marginTop: 12 }}>
          <summary>Rate snapshot</summary>
          <ul>
            {meta.fxRates.map((rate) => (
              <li key={rate.currency}>
                1 {rate.currency} = {rate.usdPerUnit} USD
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>What is median pay by job level, in USD?</h2>
        {insights.medianByLevel.map((row) => (
          <div className="bar-row" key={row.jobLevel}>
            <span>{row.jobLevel}</span>
            <span className="muted">{formatCount(row.count)} people</span>
            <strong className="amount">{formatUsd(row.medianUsd)}</strong>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Which departments account for the most pay?</h2>
        <p className="stat-note">USD comparison as of {rateDate}.</p>
        {insights.departmentTotals.map((row) => (
          <div className="bar-row" key={row.department}>
            <Link className="quiet" to={`/people?department=${encodeURIComponent(row.department)}`}>
              {row.department}
            </Link>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: barPercent(row.totalUsd, maxDepartment) }} />
            </div>
            <strong className="amount">{formatUsd(row.totalUsd)}</strong>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Who is paid the most and the least in a country?</h2>
        <p className="stat-note">Local currency. Active employees only.</p>
        <Select
          label="Country"
          data={meta.countries.map((entry) => entry.country)}
          value={country}
          onChange={(value) => setCountry(value ?? "United States")}
          allowDeselect={false}
          mb="md"
          maw={320}
        />
        {extremes ? (
          <div className="split">
            <PeopleList title="Highest" people={extremes.highest} />
            <PeopleList title="Lowest" people={extremes.lowest} />
          </div>
        ) : (
          <p>Loading this country…</p>
        )}
      </section>
    </>
  );
}

function PeopleList({
  title,
  people,
}: {
  title: string;
  people: CountryExtremes["highest"];
}) {
  return (
    <div>
      <h3>{title}</h3>
      <ol>
        {people.map((person) => (
          <li key={person.id}>
            <Link to={`/people/${person.id}`}>
              {person.firstName} {person.lastName}
            </Link>{" "}
            <span className="muted">{person.jobLevel}</span>{" "}
            <span className="amount">{formatMoney(person.annualSalary, person.currency)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function maxAmount(values: string[]): string {
  return values.reduce((max, value) => (Number(value) > Number(max) ? value : max), "0");
}
