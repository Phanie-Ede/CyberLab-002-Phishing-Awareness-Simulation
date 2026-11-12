# CyberLab 002: Phishing awareness simulation

An authorised workplace phishing-awareness exercise built around personalised email delivery, cloud-based interaction tracking and campaign reporting.

**Project status:** Campaign deployed; engagement monitoring in progress  
**Participants:** 34 employees  
**Technologies:** GoPhish, Ubuntu Server, VirtualBox, PowerShell, Gmail SMTP, Cloudflare Workers, D1, Cloudflare Pages and GitHub Pages

## What I built

- Installed GoPhish on an Ubuntu Server virtual machine and accessed its administration interface through SSH port forwarding.
- Developed and tested an HTML email template for the simulation.
- Set up a Cloudflare Worker and D1 database to associate participant IDs with tracking links and record interaction events.
- Configured a branded Cloudflare Pages entry point and a GitHub Pages landing page.
- Used PowerShell to validate 34 recipients, match each employee to a unique link, generate personalised emails and submit them through Gmail SMTP.
- Tested the complete email-to-landing-page journey and retrieved engagement data from an authenticated reporting endpoint.

## The problem I had to solve

My original plan was to run the exercise through GoPhish on a local Ubuntu virtual machine. The administration interface worked, but the phishing server used a private VirtualBox address. That meant employees outside my lab would not be able to reach its links.

I decided to keep GoPhish for email template development and move the public-facing parts of the exercise to Cloudflare and GitHub Pages. This also meant the tracking system could keep running after I shut down the virtual machine.

[View the architecture diagram](docs/architecture.svg)

## How the campaign works

1. Each enrolled employee is associated with an internal ID and a unique tracking token.
2. PowerShell inserts the employee's first name and branded link into the HTML email template.
3. Gmail SMTP accepts the personalised messages for delivery.
4. A click on the branded link passes through Cloudflare, where the click is logged before the visitor is redirected to the landing page.
5. The landing page reports visits and form submission attempts. Form contents are not collected.
6. Cloudflare D1 stores the events, and an authenticated endpoint returns participant-level counts for analysis.

GoPhish is **not** the live tracking backend for the deployed campaign. Email submission and event collection operate independently of the local lab.

## Implementation and testing

### Recipient and link matching

I prepared the recipient list, checked for duplicate addresses and confirmed that each of the 34 participants had a distinct tracking link. I matched the email records to links using employee IDs rather than assuming two CSV exports would always have the same row order.

### Email delivery

I reused the GoPhish HTML template and generated individual email previews with PowerShell. Before launch, I checked for missing links and unresolved template placeholders. I sent a test message to an external Outlook inbox, reviewed the formatting and followed the link to confirm that the redirect worked.

### Tracking and reporting

The test link produced both a click event and a landing-page visit in Cloudflare. I also discovered that an earlier test using a real participant's link appeared in the engagement report. I recorded the pre-launch test activity separately so it could be excluded from the final engagement figures without excluding genuine activity from the same participant.

### Deployment checks

| Check | Result |
| --- | ---: |
| Enrolled employees | 34 |
| Unique recipient email addresses | 34 |
| Unique branded tracking links | 34 |
| Missing or duplicate participant IDs | 0 |
| Unresolved HTML placeholders | 0 |
| External email and redirect test | Passed |
| Cloudflare click and page-visit recording | Passed |
| Emails accepted by Gmail SMTP | 34 |

The SMTP result confirms that the mail server accepted the messages. It does not establish that every message reached an inbox or was opened.

## What challenged me

**Getting beyond the lab network.** The first GoPhish links were suitable for local testing but not for an external campaign. Separating the tracking service from the virtual machine solved that problem without exposing the VM publicly.

**Keeping identities and links aligned.** Email personalisation and Cloudflare enrolment were separate processes. Using participant IDs to join the records reduced the risk of sending the wrong tracking link to an employee.

**Measuring activity accurately.** A test click appeared in the same report as employee activity. That made it clear why a baseline, timestamps and careful interpretation matter. A recorded click is also not definitive proof that a person interacted with the message; automated email-security systems may follow links.

**Understanding delivery limits.** An SMTP success message is not the same as confirmed inbox placement. The Outlook test also showed why checking the recipient experience matters.

## Security and privacy

This was an authorised workplace exercise. The landing page recorded interaction events without collecting passwords, identification numbers or sensitive form entries. The administrative reporting endpoint required authentication.

This repository contains the system design and evaluation method rather than identifiable campaign records. Employee names, email addresses, tracking tokens, credentials and raw reports are not included.

## Evaluation

The campaign is being observed over a seven-day window. The final assessment will distinguish unique participants from repeated events, exclude known setup activity and report clicks, page visits and submission attempts as separate measures. The method and its limitations are documented in [Evaluation methodology](docs/evaluation-plan.md).

The results will be added once the observation period has ended and the findings have been checked for accuracy and approved for public release.

## Repository files

| File | Contents |
| --- | --- |
| `README.md` | Project overview, implementation and validation |
| `docs/architecture.svg` | System architecture diagram |
| `docs/architecture.mmd` | Editable Mermaid source for the diagram |
| `docs/evaluation-plan.md` | Metrics, exclusions and interpretation of campaign results |



