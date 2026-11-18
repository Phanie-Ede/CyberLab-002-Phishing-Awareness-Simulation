# Campaign results and event analysis

## CyberLab 002: Workplace phishing awareness simulation

**Campaign ID:** `PMO2026`  
**Reporting period:** 11 November 2026, 15:02 WAT to 18 November 2026, 15:02 WAT  
**Scope:** 33 employee recipients, excluding my researcher-controlled company account

## 1. What I set out to test

I ran an authorised phishing-awareness simulation at my workplace using a fake benefits-enrolment email. I wanted to see what the campaign tracking system could record and whether I could use those records to investigate employee interactions without collecting sensitive form contents.

I sent 34 campaign emails. One went to my own company email address, which I used as a researcher account. That leaves **33 employee recipients** for the employee-only results below. I also used a separate test ID while building the system; neither researcher nor test activity is counted as employee engagement.

## 2. How I recorded activity

I prepared the email template in GoPhish and sent the campaign through PowerShell. The landing page was hosted on GitHub Pages. A Cloudflare Worker recorded events in a Cloudflare D1 database.

I tracked three event types:

| Event | What the system recorded |
| --- | --- |
| `email_click` | A request to the tracked email link |
| `page_visit` | A request recorded for the landing page |
| `submit_attempt` | An attempt to submit the form |

A tracked link request is not necessarily a human click. Email security tools can follow links automatically. The form tracking also did not retain submitted field contents, so a submission event is not evidence that sensitive information was disclosed.

## 3. Results after seven days

| Measure | Result |
| --- | ---: |
| Campaign emails sent | 34 |
| Employee recipients in scope | 33 |
| Employee IDs with at least one recorded click | **8** |
| Recorded interaction rate | **24.2% (8 of 33)** |
| Employee click events | 17 |
| Landing-page visit events | 15 |
| Form submission attempts | 1 |

**The 24.2% is a recorded interaction rate, not a confirmed human click-through rate.** It tells us how many employee IDs had at least one tracked link request. It does not establish how many people personally clicked the email, opened it or read it.

My initial database totals were nine participant IDs, 18 clicks, 16 page visits and one submission attempt. After checking the sending log, I identified `PMO031` as my own company account. I removed its one click and one visit from the employee results. The separate test ID, `PMOTEST001`, had already been excluded.

## 4. What I investigated

### A submission attempt from PMO007

The database recorded this sequence for `PMO007`, an employee who received the campaign email:

| 18 November 2026 (UTC) | Event |
| --- | --- |
| 10:41:25 | `email_click` |
| 10:41:26 | `page_visit` |
| 11:15:30 | `submit_attempt` |

The submission attempt was recorded about 34 minutes after the first click event. The three records show that the system tracked a link request, a page visit and a later form action against the same participant ID. They do not tell me who was operating the device, whether the page stayed open for those 34 minutes or what, if anything, was typed into the form.

### Repeated activity from PMO030

`PMO030` generated **nine click events and seven page visits** during the reporting period. That was **52.9% of the 17 employee click events**.

This mattered because 17 click events could easily be mistaken for 17 people clicking. The participant-level query showed a different picture: eight employee IDs generated those events, and one ID accounted for more than half of the clicks. I could not establish whether the repeated requests came from a person, automated link inspection or a combination of both, so I have not assigned a cause.

### A timezone mistake I corrected

I initially compared a database event at **14:59 UTC** on 11 November with the first email sent at **15:02 Nigerian time (WAT)**. That made the event appear to have happened before the campaign started.

The two timestamps were in different timezones. **15:02 WAT is 14:02 UTC**, so the 14:59 UTC event actually occurred after the first email was sent. I corrected the database query to use **11 November 14:02 UTC (inclusive) to 18 November 14:02 UTC (exclusive)**.

A separate known manual test from `PMO001` happened before that window and was not counted.

## 5. What the results cannot tell us

- **Whether every recorded click was human.** Security scanners and link previews may generate tracking requests.
- **Whether all emails reached inboxes.** My sending log records the sending process, not independently verified inbox delivery or readership.
- **Whether anyone disclosed sensitive information.** The database recorded one `submit_attempt`, but the simulation did not retain form contents.
- **Why PMO030 generated repeated events.** The logs show the requests, not their cause.
- **Whether every recipient had exactly seven days to respond.** I sent the emails between approximately 15:02 and 15:26 WAT on 11 November, but used one reporting cutoff based on the first send.

The employee-only figures also rely on my classification of researcher and employee accounts. They assume none of the remaining eight employee IDs was used for manual testing during the reporting window.

## 6. What I learnt

**I need to validate timestamps before analysing events.** A one-hour timezone difference was enough to make me misclassify a post-launch event as a pre-launch test.

**Unique participants matter more than raw click totals for this question.** Looking at individual event histories exposed repeated requests that an aggregate dashboard would have hidden.

**Event logs are most useful when I can trace a sequence.** The records for `PMO007` let me examine the order and timing of a click, visit and submission attempt without storing personal form data.

**I need clear rules for excluding my own tests.** The dedicated test ID and my company email account served different purposes, but both had to be kept out of the employee results.

## 7. Reporting and privacy

I calculated the results from Cloudflare D1 using the corrected UTC reporting window. I excluded the dedicated test ID in the database query, then removed my researcher-controlled company account from the employee-only totals.

This public report uses participant codes rather than employee names or email addresses. It does not include submitted form contents, live campaign links or identifiable infrastructure details. Any screenshots or source code added to the repository should be redacted and approved for public sharing first.
