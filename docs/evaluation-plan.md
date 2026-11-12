# Evaluation methodology

## Overview

I designed the evaluation to measure how participants interacted with the simulated phishing email and verification page.

The campaign involved 34 employees. I used unique participant identifiers to track engagement while keeping individual responses out of the public report.

The analysis focuses on observable behaviour rather than assumptions about whether participants recognised the phishing attempt.

## Observation period

I planned a seven-day observation period beginning on 11 November 2026.

The final analysis will use the recorded campaign start and end times to ensure that only events within the observation period are included.

## Engagement metrics

| Metric | What it measures |
|---|---|
| Emails accepted by SMTP | Messages accepted by the sending mail server, not necessarily delivered to recipients' inboxes |
| Unique email clicks | Participants whose tracking links recorded at least one qualifying click |
| Landing page visits | Participants whose visits to the verification page were recorded |
| Form submission attempts | Participants who attempted to submit the verification form |
| No recorded clicks | Participants for whom no qualifying link click was recorded |

I calculate participant engagement rates using the 34 enrolled employees as the denominator, excluding test accounts.

## Data validation

Before calculating the final results, I will:

1. Exclude the dedicated test participant from campaign statistics.
2. Remove the known pre-launch test events associated with participant PMO001 without excluding any genuine subsequent activity.
3. Use event timestamps to distinguish campaign activity from setup and testing.
4. Check whether automated security scanners or link previews may have generated tracking events.
5. Count each participant once per engagement metric, regardless of repeated interactions.
6. Document any limitations affecting the reliability of the results.

Where only cumulative event counts are available, I will use the recorded baseline to identify changes and explain the limits of that approach.

## Privacy and reporting

The landing page records interaction events without collecting passwords or the contents of submitted forms.

The public report will contain aggregate statistics only. Individual employee identifiers, email addresses and engagement histories will remain outside the repository.

## Final analysis

After the observation period, I will prepare an anonymised summary of email clicks, landing page visits and submission attempts.

I will also examine the differences between these events and discuss what they reveal about participant engagement.

The results will be interpreted cautiously. A recorded click does not necessarily indicate that an employee was deceived, and the absence of a click does not establish that an employee recognised the simulation.
