# Social Media Scheduler — Task Tracker

This file tracks all tasks for the MVP. Check this before any PR or release to ensure nothing is missing.

---

## Phase 1 — MVP Core (LinkedIn → Meta Pivot)

### Task 1: Project Setup + Supabase Auth
**Status:** Pending

**Description:** Initialize Next.js project with Supabase Auth (email/password + Google/GitHub OAuth). Set up Prisma schema for User model. Configure shadcn/ui and Tailwind v4 with dark/light mode toggle.

**Deliverables:**
- [x] Next.js 16 project structure (existing)
- [ ] Prisma schema with User model (id, email, name, stripeCustomerId, subscriptionTier, createdAt)
- [ ] Supabase Auth configured (email/password + Google/GitHub OAuth)
- [ ] shadcn/ui installed and configured
- [ ] Tailwind v4 with dark/light mode toggle
- [ ] Auth pages: login, signup, email verification
- [ ] Protected dashboard route

---

### Task 2: Meta OAuth Integration
**Status:** Pending

**Description:** Build Meta OAuth flow to connect Facebook Pages and Instagram Business accounts. Store tokens in MetaPage model. Include mock mode for early dev before app approval.

**Deliverables:**
- [ ] Meta Developer App setup (or instructions for user to create one)
- [ ] Meta OAuth flow (authorize FB/IG pages)
- [ ] MetaPage model (id, userId, facebookPageId, instagramAccountId, accessToken, expiresAt)
- [ ] Token refresh background job
- [ ] Mock mode for local development (before Meta app approval)
- [ ] Settings page to connect/disconnect Meta pages

---

### Task 3: Post Composer + Scheduling
**Status:** Pending

**Description:** Build the post composer UI with rich text editor, media upload (images, videos, carousel support), draft saving, and scheduling datetime picker.

**Deliverables:**
- [ ] Rich text editor (Tiptap or similar)
- [ ] Media upload component (images, videos)
- [ ] Carousel/multi-image post support
- [ ] Post type selector (feed/story/reel/carousel)
- [ ] Schedule datetime picker
- [ ] Draft auto-save
- [ ] Post list view (filter by status: draft/scheduled/published/failed)
- [ ] Edit/delete posts
- [ ] Tier enforcement (Free tier post limit check before scheduling)

---

### Task 4: Queue Worker for Publishing
**Status:** Pending

**Description:** Build BullMQ + Upstash worker to pick up due posts and publish via Meta Graph API. Handle failures with exponential backoff retry (up to 3 times). Send email alert on final failure.

**Deliverables:**
- [ ] BullMQ queue setup with Upstash Redis
- [ ] Job scheduler (runs every minute, picks up due posts)
- [ ] Meta Graph API publish integration
- [ ] Retry logic (exponential backoff, max 3 attempts)
- [ ] Post status update (scheduled → published / failed)
- [ ] Failed post email alert to user
- [ ] Worker deployment script (separate process or Vercel worker)

---

### Task 5: Basic Analytics + Reports
**Status:** Pending

**Description:** Fetch post metrics (impressions, clicks, engagement, saves) from Meta Graph API and store in AnalyticsEvent. Build analytics dashboard with date range filtering.

**Deliverables:**
- [ ] AnalyticsEvent model (id, postId, impressions, clicks, engagement, saved, collectedAt)
- [ ] Metrics fetch job (triggered after post goes live)
- [ ] Analytics API route (fetch + store metrics)
- [ ] Analytics dashboard UI (post performance table/charts)
- [ ] Date range filter
- [ ] Post list sorted by performance

---

## Phase 2 — Payments + Email

### Task 6: Stripe Integration (Free/Paid Tiers)
**Status:** Pending

**Description:** Implement 2-tier model (Free limited posts/mo, Paid unlimited). Integrate Stripe Checkout, webhook handler for subscription events. Enforce tier at post creation/scheduling time.

**Deliverables:**
- [ ] Stripe account setup
- [ ] Free tier: post limit per month (e.g., 10 posts)
- [ ] Paid tier: unlimited posts
- [ ] Stripe Checkout for upgrade flow
- [ ] Stripe webhook handler (checkout.session.completed, customer.subscription.updated/deleted)
- [ ] User subscription state sync (FREE/PAID)
- [ ] Tier enforcement UI (upgrade prompt when limit hit)

---

### Task 7: Email Notifications (Resend)
**Status:** Pending

**Description:** Set up Resend with React Email templates. Implement email verification on signup, post published confirmation, post failed alert, and weekly performance digest.

**Deliverables:**
- [ ] Resend account + API key setup
- [ ] React Email template setup
- [ ] Email verification on signup
- [ ] Post published confirmation email
- [ ] Post failed alert email
- [ ] Weekly performance digest email

---

## Data Models (Prisma Schema)

```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  stripeCustomerId String?
  subscriptionTier String   @default("FREE") // FREE | PAID
  emailVerified    Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  metaPages MetaPage[]
  posts     Post[]
}

model MetaPage {
  id                String   @id @default(cuid())
  userId            String
  facebookPageId    String
  instagramAccountId String?
  accessToken       String
  expiresAt         DateTime
  pageName          String?
  createdAt         DateTime @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  posts Post[]

  @@unique([userId, facebookPageId])
}

model Post {
  id            String    @id @default(cuid())
  userId        String
  metaPageId    String
  content       String?
  mediaUrls     String[]  // JSON array of URLs
  postType      String    @default("feed") // feed | story | reel | carousel
  status        String    @default("draft") // draft | scheduled | published | failed
  scheduledAt   DateTime?
  publishedAt   DateTime?
  metaPostId    String?
  retryCount    Int       @default(0)
  lastError     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  metaPage   MetaPage    @relation(fields: [metaPageId], references: [id], onDelete: Cascade)
  analytics  AnalyticsEvent[]
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  postId      String
  impressions Int      @default(0)
  clicks      Int      @default(0)
  engagement  Int      @default(0)
  saved       Int      @default(0)
  collectedAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | List posts (filter by status, date range) |
| POST | `/api/posts` | Create draft post |
| PUT | `/api/posts/:id` | Update draft post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/schedule` | Schedule a draft post |
| POST | `/api/posts/:id/publish` | Publish immediately |
| POST | `/api/analytics/fetch` | Fetch metrics for published posts |
| GET | `/api/analytics/posts` | Get post performance data |
| POST | `/api/webhooks/stripe` | Handle Stripe subscription events |
| POST | `/api/webhooks/meta` | Handle Meta webhook verifications |

---

## Tech Stack Reference

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) + Prisma |
| Auth | Supabase Auth |
| Queue | BullMQ + Upstash Redis |
| Email | Resend + React Email |
| Payments | Stripe |
| Deployment | Vercel |
| Testing | Vitest |

---

## Acceptance Criteria

- [ ] User can sign up, verify email, log in/out
- [ ] User can connect Facebook Page + Instagram account via OAuth
- [ ] User can create posts with rich text and media
- [ ] User can schedule posts for future publish time
- [ ] Posts are published automatically at scheduled time via queue worker
- [ ] Failed posts trigger retry and email alert
- [ ] Post performance metrics are tracked and displayed
- [ ] Weekly digest email with performance summary
- [ ] Free tier enforces post limit, Paid tier allows unlimited
- [ ] Dark + light mode toggle works
- [ ] All features tested with unit + integration tests