# Evaluation plan

This document describes the intended analysis, not completed campaign findings.

## Observation window

Record the exact campaign submission time and the agreed end of the observation period before calculating rates. A seven-day window is a proposed starting point, not an established campaign requirement.

## Measures

- **SMTP accepted:** Number of messages accepted by the sending SMTP server. Do not label this as confirmed inbox delivery.
- **Participants with a recorded click:** Distinct enrolled employee IDs with at least one qualifying click after launch.
- **Participants with a page visit:** Distinct enrolled employee IDs with a qualifying page-visit event after launch.
- **Participants with a submission attempt:** Distinct enrolled employee IDs with a qualifying form-attempt event after launch. No entered data is collected.
- **No recorded interaction:** Enrolled employees with no qualifying click during the observation window.

## Cleaning and limitations

1. Exclude the dedicated pilot participant from employee denominators.
2. Exclude known setup events, including the pre-launch test associated with participant PMO001, while retaining that participant's later events.
3. Use timestamps and event history where available; a saved baseline of cumulative counts is a fallback for identifying increases, not a substitute for event-level attribution.
4. Check for security-scanner clicks and automated link previews before interpreting events as human behaviour.
5. Avoid treating multiple clicks from one participant as multiple people.
6. Report the observation window, denominator, missing data and uncertainty alongside percentages.
7. Publish only aggregate, approved findings; do not publish employee-level results.

## Planned output

An anonymised summary table and short discussion of what the measurements can and cannot establish. No final effectiveness claims should be made until the observation window ends and the data has been reviewed.
