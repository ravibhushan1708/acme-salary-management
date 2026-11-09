# ACME Salary Management — Requirements

## Goal

Give ACME’s HR manager one web application to maintain annual base salaries for 10,000 employees across countries, and to answer how the organization pays people, without working from spreadsheets.

## User

One HR manager. That person can see and edit every employee’s salary. Employees and managers do not sign in.

## Scope and features

- Sign in with a single HR account.
- Browse and search people by name, email, employee number, country, department, job level, and status. The list is paged.
- View one person and edit annual base salary, department, job title, job level, and status. Country and currency stay paired with the employee.
- Keep a short revision each time salary changes: previous amount, new amount, currency, and time.
- Answer these questions on the home screen, using active employees:
  - How many people do we employ, and in which countries?
  - What is annual payroll in each local currency?
  - What is that payroll worth in USD, so countries can be compared?
  - What is median pay by job level, in USD?
  - Which departments account for the most pay, in USD?
  - Who is paid the most and the least in a chosen country, in local currency?
- Show the date of the USD rate snapshot beside every comparison figure.
- Export the current employee sheet as CSV.

## Data the product stores

Each employee has an employee number, name, email, country, currency, department, job title, job level, annual base salary, and status (active or inactive). Salary is stored in the local currency. A fixed table of USD rates, dated 15 January 2026, is used only for comparison.

## Deliberately out of scope

- Payroll, tax, deductions, payslips, and payments. The problem is the salary sheet, not running payroll.
- Approval workflows, salary bands, and a Finance role. The brief names one user.
- Employee or manager self-service.
- Live exchange rates. A dated snapshot stays testable and is labeled as a comparison, not an amount to pay.
- Bonus, equity, and benefits. The sheet being replaced is base salary.
- A natural-language chat over pay data. Wrong numbers are worse than a fixed, tested question.
- Demographic analysis such as gender pay. Those fields are not in the brief.
- Separate services, a cache, or a standalone database server. One user and 10,000 rows do not need them.

## Done when

An HR manager can sign in, read the pay questions for a seeded population of 10,000 employees, open a person, change their salary, see the revision, and see the totals move.
