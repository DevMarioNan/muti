# Database ERD — Social Media Scheduler

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User        │       │   UserEmail     │
│                 │       │   Preference    │
│  id (PK)         │       │                 │
│  email           │◄──────│  userId (FK)    │
│  name            │  1:1  │  postPublished  │
│  avatarUrl       │       │  postFailed     │
│  password        │       │  weeklyDigest   │
│  emailVerified   │       │  marketingEmails │
│  subscriptionTier│       └─────────────────┘
│  stripeCustomerId│
│  stripeSubId     │       ┌─────────────────┐
│  stripeSubStatus │       │   MetaAccount   │
└────────┬─────────┘       │                 │
         │ 1:1            │  id (PK)         │
         ▼                 │  userId (FK)    │◄────┐
┌─────────────────┐       │  instagramBizId  │
│      Post        │       │  instagramUsername│
│                 │       │  accessToken    │
│  id (PK)         │       │  accessTokenExp │
│  userId (FK)     │       │  connectedAt    │
│  metaAccountId(FK│───────└─────────────────┘
│  caption         │       1:N
│  mediaUrls[]     │       ┌─────────────────┐
│  postType        │       │  ScheduledJob   │
│  status          │       │                 │
│  scheduledAt     │       │  id (PK)        │
│  publishedAt     │       │  postId (FK)    │◄────┘
│  metaPostId      │       │  status         │  1:1
│  retryCount      │       │  attempts       │
│  lastError       │       │  runAt          │
└────────┬─────────┘       │  lastError      │
         │ 1:N            └─────────────────┘
         ▼
┌─────────────────┐
│ AnalyticsEvent  │
│                 │
│  id (PK)        │
│  postId (FK)    │
│  impressions    │
│  likes          │
│  comments       │
│  saves          │
│  shares         │
│  reach          │
│  collectedAt    │
└─────────────────┘
```

## Relations Summary

| Relation | Type | Description |
|----------|------|-------------|
| User → MetaAccount | 1:1 | One Instagram account per user |
| User → Post | 1:N | User owns multiple posts |
| User → UserEmailPreference | 1:1 | One preferences record per user |
| MetaAccount → Post | 1:N | Each IG account can have multiple posts |
| Post → ScheduledJob | 1:1 | Each scheduled post has one job |
| Post → AnalyticsEvent | 1:N | Multiple analytics snapshots per post |

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| MetaAccount | `instagramBusinessId` | Fast lookup by IG user ID |
| Post | `(scheduledAt, status)` | Queue worker queries |
| ScheduledJob | `(status, runAt)` | Find pending jobs to run |
| AnalyticsEvent | `(postId, collectedAt)` | Time-series queries per post |

## Design Notes

- `User.password` is nullable — OAuth-only users don't have passwords
- `MetaAccount.accessToken` should be encrypted at rest (Supabase handles this)
- `Post.caption` is the Instagram caption text, `mediaUrls` stores image/video URLs
- `AnalyticsEvent` stores 90 days of metrics (retention policy enforced at application level)
- `stripeSubId` is nullable — users without a subscription have no Stripe subscription ID