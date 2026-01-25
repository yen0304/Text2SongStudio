# Design: Add Job Feedback View

## Overview

This design describes how to expose feedback records through the job context, leveraging existing data relationships without schema changes.

## Data Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ GenerationJob   │      │  AudioSample    │      │    Feedback     │
│                 │      │                 │      │                 │
│ id              │      │ id              │◄─────│ audio_id        │
│ audio_ids[]  ───┼─────►│ prompt_id       │      │ rating          │
│ prompt_id       │      │ adapter_id      │      │ preferred_over  │
│ status          │      │ ...             │      │ tags[]          │
└─────────────────┘      └─────────────────┘      │ notes           │
                                                  └─────────────────┘
```

## API Design

### New Endpoint: Get Job Feedback

```
GET /generate/{job_id}/feedback
```

**Response Structure:**

```json
{
  "job_id": "uuid",
  "prompt_id": "uuid",
  "total_samples": 4,
  "total_feedback": 12,
  "average_rating": 3.8,
  "samples": [
    {
      "audio_id": "uuid",
      "label": "A",
      "feedback": [
        {
          "id": "uuid",
          "rating": 4,
          "rating_criterion": "overall",
          "preferred_over": null,
          "tags": ["good_melody", "creative"],
          "notes": "Nice rhythm section",
          "created_at": "2026-01-25T10:00:00Z"
        }
      ]
    }
  ]
}
```

### Enhanced Endpoint: List Feedback with Job Filter

```
GET /feedback?job_id={job_id}&page=1&limit=50
```

This requires joining through the audio_ids relationship to filter feedback belonging to a specific job.

## Frontend Components

### JobFeedbackPanel

```
┌─────────────────────────────────────────────────────────────┐
│ Job Feedback                                    12 total    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sample A                                    ★★★★☆ (4.0)│ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👍 Preferred over Sample B                          │ │ │
│ │ │ Tags: good_melody, creative                         │ │ │
│ │ │ "Nice rhythm section"                               │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sample B                                    ★★★☆☆ (3.0)│ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Tags: repetitive                                    │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Feedback History Page

```
┌─────────────────────────────────────────────────────────────┐
│ Feedback History                                            │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Job ID: ▼ All Jobs    ] [Rating: ▼ Any ]         │
├─────────────────────────────────────────────────────────────┤
│ │ Audio A │ Job abc123 │ ★★★★☆ │ good_melody │ 2026-01-25 │ │
│ │ Audio B │ Job abc123 │ ★★★☆☆ │ repetitive  │ 2026-01-25 │ │
│ │ Audio A │ Job def456 │ ★★★★★ │ creative    │ 2026-01-24 │ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Notes

### Backend Query Strategy

To get feedback for a job, we need to:

1. Fetch the job to get `audio_ids`
2. Query `Feedback` where `audio_id IN (audio_ids)`
3. Optionally join with `AudioSample` to get creation order for labeling

```python
# Efficient query using IN clause
feedback_query = select(Feedback).where(
    Feedback.audio_id.in_(job.audio_ids)
).order_by(Feedback.created_at.desc())
```

### Frontend State Management

The `JobFeedbackPanel` will:
- Fetch feedback on mount when job ID is provided
- Cache results to avoid refetching on tab switches
- Support manual refresh

## Alternatives Considered

### Alternative 1: Add job_id to Feedback table

**Pros:** Direct relationship, simpler queries
**Cons:** Schema change, data redundancy, migration needed

**Decision:** Rejected - existing relationship is sufficient and avoids schema changes.

### Alternative 2: Create a materialized view

**Pros:** Fast queries
**Cons:** Added complexity, maintenance overhead

**Decision:** Rejected - query performance is acceptable with proper indexing.
