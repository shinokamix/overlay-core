# Issue Labels

Use these labels for triage and release decisions.

## Severity labels

| Label         | Meaning                                                                      | Expected response                        |
| ------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| `severity/p0` | Critical outage, data loss, security incident, or app unusable for core flow | Immediate response, release blocker      |
| `severity/p1` | Major broken behavior with no reasonable workaround                          | Same-day triage, usually release blocker |
| `severity/p2` | Noticeable bug with workaround or limited scope impact                       | Planned fix in normal iteration          |
| `severity/p3` | Minor defect, polish issue, low impact                                       | Backlog candidate                        |

## Release labels

| Label                  | Meaning                                       |
| ---------------------- | --------------------------------------------- |
| `release/blocker`      | Must be fixed before next `stable` release    |
| `release/high-risk`    | Can ship only with explicit go/no-go sign-off |
| `release/not-blocking` | Does not block release                        |

## Usage rules

- Every bug must have exactly one `severity/*` label after triage.
- Every bug in active milestone must have one `release/*` label.
- `severity/p0` and `severity/p1` default to `release/blocker` unless explicitly downgraded with rationale.
- If label choice is unclear, apply `severity/p1` and escalate in triage.
