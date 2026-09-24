# BRD: Employee Self-Service Portal

_Sample business requirements document for the POC. Northwind Ltd is a fictional company._

## 1. Background
HR handles about 300 routine requests per month (payslips, leave balances, address changes). Most can be self-served.

## 2. Objectives
- Reduce routine HR tickets by 40% within 6 months of launch.
- Let employees view payslips, leave balances and personal details without contacting HR.

## 3. Scope
**In scope**
- View and download payslips (last 24 months)
- Leave requests and approvals
- Update address, bank details and emergency contacts
- Company announcements

**Out of scope (phase 1)**
- Performance reviews
- Recruitment and applicant tracking

## 4. Stakeholders
- Business owner: Head of HR
- Delivery: Internal Tools team
- Users: all employees and line managers

## 5. Functional requirements
1. Employees log in with company single sign-on.
2. Managers see a queue of pending leave requests and can approve or reject with a comment.
3. Changes to bank details require re-authentication and trigger an email confirmation.
4. Every change to personal data is written to an audit log.

## 6. Non-functional requirements
- Available 99.5% during business hours.
- Pages load within 2 seconds.
- GDPR compliant: personal data is encrypted at rest and access is logged.

## 7. Timeline
- Discovery: January
- Build: February to April
- Pilot with 50 users: May
- Company-wide launch: June
