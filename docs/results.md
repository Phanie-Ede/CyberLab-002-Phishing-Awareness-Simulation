# Campaign results and event analysis

## CyberLab 002: Workplace phishing awareness simulation

**Campaign:** PMO2026  
**Observation window:** 11 November 2026, 15:02 WAT to 18 November 2026, 15:02 WAT (14:02 UTC on each date)  
**Status:** Seven-day event analysis completed; human attribution and delivery verification remain limited.

## 1. Purpose and scope

This authorised workplace exercise evaluated how a simulated benefits-enrolment phishing message and its landing page were encountered by recipients. The project also tested whether a lightweight tracking pipeline could support a defensible, privacy-conscious analysis of email-link events, landing-page visits and form submission attempts.

The campaign sent **34 emails**, including one researcher-controlled company account. **33 employee accounts** therefore form the employee-only denominator. The researcher account and a separate dedicated test account are excluded from employee results. This report presents anonymised aggregates and does not publish employee identities or email addresses.

## 2. Technical setup and measurement

The simulation used an email template developed with GoPhish, PowerShell-based email sending, a GitHub Pages landing page and a Cloudflare Worker backed by Cloudflare D1 for event recording. Events were classified as `email_click`, `page_visit` and `submit_attempt`.

A recorded `email_click` indicates that the tracking endpoint was requested. It is **not** conclusive proof that a person clicked: automated email security inspection may also request tracked URLs. Likewise, a `submit_attempt` is an event recorded by the simulation, not proof that sensitive information was disclosed.

The reporting window was converted from Nigerian local time (WAT, UTC+1) to UTC before querying D1. This matters because a local sending-log timestamp must not be compared directly with a UTC database timestamp.

## 3. Seven-day findings

| Measure | Result | Interpretation |
| --- | ---: | --- |
| Emails sent | 34 | Includes one researcher-controlled company account |
| Employee accounts in scope | 33 | Denominator for employee-only rate |
| Employee IDs with recorded `email_click` events | 8 | 8 / 33 = **24.2%** observed tracked-link interaction rate |
| Employee `email_click` events | 17 | Repeat events included |
| Employee `page_visit` events | 15 | Repeat events included |
| Employee `submit_attempt` events | 1 | Recorded against one employee ID |

**Important:** The 24.2% figure is the proportion of employee IDs with at least one recorded click event, **not** a verified human click-through rate. Sending-log records alone do not prove inbox delivery or that recipients read the email.

The source D1 query returned **nine IDs, 18 click events, 16 page visits and one submission attempt** within the seven-day window after excluding the dedicated test ID. One of those nine IDs, **PMO031**, was subsequently confirmed as the researcher's own company email account and was removed from employee-only metrics (one click and one visit). The resulting employee-only figures are shown above.

## 4. Investigation of notable events

### Submission attempt

One employee recipient, represented here as **PMO007**, generated the following recorded event sequence on 18 November 2026 (database timestamps, UTC):

| Time (UTC) | Recorded event |
| --- | --- |
| 10:41:25 | `email_click` |
| 10:41:26 | `page_visit` |
| 11:15:30 | `submit_attempt` |

The recorded submission attempt occurred approximately **34 minutes** after the first tracked click. This sequence supports that the tracking system registered a click, visit and later submission attempt for the same participant ID. It does **not** establish uninterrupted browsing, the identity of the person operating the device, the contents of the form, or successful disclosure of information. The simulation was designed not to retain submitted form contents.

### Repeated requests

One employee ID, **PMO030**, generated **nine click events and seven page visits** during the reporting window. That account contributed **9 of 17 employee click events (52.9%)**. The event concentration makes raw click totals a poor proxy for the number of people who interacted with the campaign. The cause of repeated requests was not conclusively determined; possibilities include repeated user actions or automated inspection. No such cause is asserted as fact.

### Timezone and test-account corrections

An early review incorrectly treated an event at **14:59 UTC** on 11 November as preceding the first email sent at **15:02 WAT**. After aligning timezones, the first send was **14:02 UTC**, meaning that event was after launch and within the observation window.

A known pre-launch manual test associated with **PMO001** was outside the reporting window. The dedicated test ID **PMOTEST001** was excluded. **PMO031** was separately confirmed as a researcher-controlled company email account and removed from employee metrics even though it was included in the 34 emails sent.

## 5. Limitations

1. **Human attribution:** Tracking requests can be generated by email-security scanners, link previews or other automated systems. The observed interaction rate is not a verified rate of employee clicks.
2. **Delivery and readership:** The send log documents sending activity, not independently verified inbox placement, email opens or readership. An absence of recorded clicks does not demonstrate that a recipient ignored the message.
3. **Form activity:** The database records a `submit_attempt` event but does not establish the contents of any form fields or a successful sensitive-data disclosure.
4. **Repeat events:** Multiple requests by one participant can inflate raw event totals. Unique participant IDs and event totals are reported separately.
5. **Timing:** The seven-day window is anchored to the first recorded send at 15:02 WAT on 11 November. Emails were sent over approximately 24 minutes, so recipients did not all have identical exposure periods.
6. **Classification:** Employee-versus-researcher classification relies on the campaign operator's confirmation of account ownership. The final figures assume the remaining eight tracked IDs were not used for manual testing during the reporting window.

## 6. Lessons learnt

- **Align timezones before filtering events.** Comparing WAT sending logs directly with UTC database records initially produced a mistaken pre-launch classification.
- **Separate events from people.** A participant-level breakdown exposed how one ID accounted for over half of employee click events.
- **Preserve an audit trail.** Event type, participant ID and timestamp made it possible to reconstruct the sequence around the recorded submission attempt.
- **Distinguish observation from inference.** The logs support recorded requests and a submission attempt, not confirmed human intent, email readership or disclosure of form contents.
- **Keep research activity out of employee outcomes.** Both the dedicated test account and the researcher's company account needed explicit exclusion rules.

## 7. Reproducibility and privacy

Results were calculated from Cloudflare D1 event records using a UTC window of `2026-11-11 14:02:00` (inclusive) to `2026-11-18 14:02:00` (exclusive). The dedicated test ID was excluded from the initial aggregate; the researcher-controlled account was then excluded to obtain employee-only results. No personal email addresses, names, submitted form contents or live campaign links are included here.

For public sharing, use only approved, redacted screenshots and sanitised code. Obtain organisational approval before publishing material that could identify the employer, recipients or operational infrastructure.
