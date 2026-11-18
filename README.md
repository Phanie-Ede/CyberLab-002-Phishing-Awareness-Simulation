# CyberLab 002: Phishing awareness simulation

An authorised workplace phishing-awareness simulation using personalised emails, cloud-based tracking and event analysis.

**Status:** Completed  
**Campaign scope:** 33 employees and one researcher account  
**Observation period:** 11–18 November 2026  
**Technologies:** GoPhish, Ubuntu Server, VirtualBox, PowerShell, Gmail SMTP, Cloudflare Workers, Cloudflare D1, Cloudflare Pages and GitHub Pages

## Project overview

I built and deployed a phishing-awareness simulation to understand how employees interact with suspicious emails and to gain practical experience with phishing infrastructure, email automation and security monitoring.

The exercise involved sending personalised healthcare enrolment emails, directing recipients to a simulated enrolment page and recording their interactions over seven days.

The campaign was conducted with workplace authorisation. The landing page did not collect passwords, identification numbers or other sensitive form entries.

### Key results

Of the 33 employees included in the campaign, eight had recorded tracking activity during the observation period.

| Metric | Total events | Unique employees |
| --- | ---: | ---: |
| Email clicks | 18 | 8 |
| Landing-page visits | 16 | 8 |
| Form submission attempts | 1 | 1 |

**Recorded interaction rate: 24.2% (8 of 33 employees).**

These figures represent recorded events, not necessarily deliberate human actions. Automated email-security systems can follow links, so the results should not be treated as a confirmed human click-through rate.

The researcher account and designated test account were excluded from the employee results.

[View the full results](docs/results.md)

## The problem

My original plan was to run the entire simulation through GoPhish on an Ubuntu Server virtual machine.

I installed GoPhish, configured the administration interface and accessed it through SSH port forwarding. However, the phishing server was running on a private VirtualBox IP address, which meant employees outside my lab could not access its landing pages.

I needed a way to make the campaign accessible without exposing the virtual machine to the public internet.

I decided to separate email preparation, message delivery and interaction tracking into different components.

This allowed me to use GoPhish for template development while moving the live campaign infrastructure to cloud-hosted services.

## System architecture

The final setup used four main components:

| Component | Role |
| --- | --- |
| GoPhish on Ubuntu Server | Email template development and initial testing |
| PowerShell and Gmail SMTP | Recipient validation, email personalisation and SMTP submission |
| Cloudflare Workers and D1 | Tracking-link handling, event storage and reporting |
| Cloudflare Pages and GitHub Pages | Public-facing campaign entry point and landing page |

[View the architecture diagram](docs/architecture.svg)

### How the system worked

1. **Participant enrolment:** Each account was assigned an internal participant ID and a unique tracking token.
2. **Email preparation:** PowerShell matched recipient records to tracking links using participant IDs and generated personalised HTML emails.
3. **Email submission:** The messages were submitted through Gmail SMTP, with each attempt recorded in a CSV log.
4. **Link tracking:** When a tracking link was requested, Cloudflare handled the request and recorded the corresponding event before redirecting to the landing page.
5. **Landing-page tracking:** The page reported visits and form submission attempts without transmitting the contents of the form fields.
6. **Reporting:** Cloudflare D1 stored the events, which were retrieved and analysed after the observation period.

GoPhish was not responsible for sending the final campaign emails or collecting the deployed campaign's engagement data.

## Implementation

### 1. Preparing and validating recipients

I prepared the recipient list and checked for duplicate email addresses, missing tracking links and unresolved template placeholders.

Because recipient records and tracking tokens came from separate processes, I matched them using participant IDs rather than relying on CSV row positions.

This reduced the risk of sending an employee another participant's tracking link.

The workflow generated individual HTML email previews, which I reviewed before submission.

### 2. Automating email submission with PowerShell

I used PowerShell and the .NET `System.Net.Mail` classes to submit the campaign emails through Gmail SMTP.

The sending workflow included:

- Creating HTML messages with `MailMessage`.
- Adding each recipient's email address and personalised message body.
- Configuring SMTP on port 587 with TLS enabled.
- Requesting confirmation before starting the campaign.
- Handling submission errors separately for each recipient.
- Recording submission status, timestamps and error messages in a CSV file.
- Disposing of mail and SMTP objects after each attempt.
- Waiting three seconds between recipient-processing attempts.

The script saved the submission log after each attempt, so completed records would remain available if execution was interrupted.

All 34 messages were accepted for submission by the SMTP server.

This confirms successful SMTP submission, not delivery to every recipient's inbox.

A sanitised reconstruction of the sending workflow is available in [`src/powershell-smtp-sender.ps1`](src/powershell-smtp-sender.ps1). Some setup details were reconstructed from the recovered commands, and the script has not been independently execution-tested.

### 3. Building the tracking system

I used a Cloudflare Worker to handle tracking requests and a Cloudflare D1 database to store campaign events.

The system recorded three event types:

| Event | Meaning |
| --- | --- |
| `email_click` | A request was recorded against a tracking link |
| `page_visit` | The landing page reported a visit |
| `submit_attempt` | The landing page reported an attempted form submission |

The Worker used participant identifiers and tracking tokens to associate events with the campaign.

The reporting endpoint required authentication, while the landing page sent only the information needed to record interaction events.

Form contents were not transmitted to the tracking backend.

Sanitised versions of the Worker and landing page are available in the [`src`](src/README.md) directory.

### 4. Testing the campaign

Before sending the campaign emails, I tested the complete journey using an external Outlook inbox.

I checked that:

- The personalised email rendered correctly.
- The tracking link redirected to the intended landing page.
- Cloudflare recorded click and page-visit events.
- The landing page displayed the expected security-awareness feedback.
- The reporting endpoint returned recorded activity.

During testing, I discovered that a pre-launch interaction using a real participant's tracking link had appeared in the event records.

I addressed this during analysis by using a defined observation window and excluding known test activity.

This was an important lesson in maintaining clean data when testing and live activity share the same infrastructure.

## Campaign results

The observation window ran from **11 November 2026 at 14:02 UTC to 18 November 2026 at 14:02 UTC**.

The analysis covered 33 employees, excluding the researcher account and designated test account.

### Recorded activity

- **8 employees** were associated with 18 email-click events.
- **8 employees** were associated with 16 landing-page visits.
- **1 employee** generated a form submission-attempt event.

One participant accounted for 10 of the 18 click events and 8 of the 16 page visits.

This concentration of activity is worth investigating. It may reflect repeated interactions, automated link inspection or a combination of both.

The available records do not establish which explanation is correct.

### What the results tell us

The campaign recorded tracking activity associated with eight employees, representing 24.2% of the employee population.

However, I would not interpret that figure as the percentage of employees who deliberately clicked a phishing email.

Email-security tools can inspect links automatically, and repeated events do not necessarily represent separate actions by an employee.

Similarly, the single submission-attempt event shows that the landing page received an attempt signal. It does not mean that any form contents were collected.

The results are therefore useful for identifying recorded interactions and understanding the limits of the tracking system, rather than making definitive claims about employee behaviour.

The full analysis, exclusions and limitations are documented in [Campaign results](docs/results.md) and [Evaluation methodology](docs/evaluation-plan.md).

## Challenges and lessons learnt

### Moving the campaign beyond my local lab

The GoPhish server worked inside the virtual machine but could not serve external users through its private IP address.

Moving the public-facing infrastructure to Cloudflare and GitHub Pages allowed the campaign to run without keeping the Ubuntu virtual machine online.

It also gave me practical experience connecting independently deployed services.

### Matching recipients to the correct tracking links

Email personalisation and participant enrolment were handled separately.

I used participant IDs to match the records and validated the resulting emails before submission. This was more reliable than assuming the CSV files had identical row orders.

### Handling errors during email submission

The PowerShell workflow used `try`, `catch` and `finally` blocks to handle errors and release resources.

It also saved the CSV log after each attempt.

This made the sending process easier to monitor and reduced the risk of losing submission records if something went wrong.

### Interpreting tracking data

One of the biggest lessons was that collecting events is not the same as understanding them.

A single participant can generate several clicks. Automated security systems may also visit links before an employee sees the message.

I had to separate unique employees from total events, exclude known testing activity and avoid treating every recorded click as a human action.

## Security and privacy

This was an authorised workplace simulation.

The landing page was designed to record interaction events without collecting sensitive form contents.

The reporting endpoint required authentication, and participant-level records were used for campaign analysis rather than included in the public-facing documentation.

The repository contains sanitised source code, architecture documentation and supporting evidence. Employee names, email addresses, live tracking tokens, credentials and raw participant-level reports are not intended for public release.

The sanitised source files contain placeholders and should not be treated as ready-to-deploy campaign infrastructure.

## Limitations

The project had several limitations:

- SMTP acceptance did not confirm delivery to individual inboxes.
- Recorded clicks could include automated email-security checks.
- The tracking data could not reliably distinguish every human interaction from automated activity.
- The campaign involved a relatively small group of employees in one organisation.
- The reconstructed PowerShell sender has not been independently execution-tested.

These limitations matter because the quality of a security report depends on how accurately the evidence is interpreted.

## Repository structure

| File | Description |
| --- | --- |
| `README.md` | Project overview, implementation and findings |
| [`docs/architecture.svg`](docs/architecture.svg) | System architecture diagram |
| [`docs/architecture.mmd`](docs/architecture.mmd) | Editable Mermaid architecture source |
| [`docs/evaluation-plan.md`](docs/evaluation-plan.md) | Evaluation methodology and exclusions |
| [`docs/results.md`](docs/results.md) | Campaign findings and interpretation |
| [`evidence/README.md`](evidence/README.md) | Evidence index |
| [`src/README.md`](src/README.md) | Source-code documentation |
| [`src/worker.js`](src/worker.js) | Sanitised Cloudflare Worker |
| [`src/index.html`](src/index.html) | Sanitised landing page |
| [`src/powershell-smtp-sender.ps1`](src/powershell-smtp-sender.ps1) | Reconstructed PowerShell email sender |

## Conclusion

CyberLab 002 gave me practical experience building and testing a phishing-awareness simulation across local and cloud infrastructure.

I worked with SMTP automation, PowerShell scripting, Cloudflare Workers, database event logging, web deployment and campaign analysis.

Beyond getting the system to work, the project taught me the importance of validating data, handling failures and being precise about what security evidence can actually prove.

The final result is a working example of how phishing-awareness infrastructure can be built, monitored and evaluated, including the technical challenges and limitations encountered along the way.
