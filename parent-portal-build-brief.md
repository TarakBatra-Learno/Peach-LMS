# Parent / Family Portal Build Brief for Codex

## 1. Objective

Build the **Parent / Family Portal** as the third persona in the platform, alongside the existing teacher and student portals.

This portal should give families a calm, trustworthy, mobile-friendly view of **their child’s learning, school communication, and family account settings**. It must cover **all non-low-priority parent features** from the Toddle feature priority map and be framed for an **IB LMS** where curriculum context matters, portfolios are central, and reports / assessment evidence are shared intentionally.

This is a **product-scope brief**, not a codebase mapping exercise. Do not spend effort reverse-engineering connections between existing teacher/student code. Instead, assume the parent portal will eventually integrate into the same platform and should:
- feel native beside the teacher and student portals
- read from the same underlying school / class / student / assessment / portfolio / report / calendar / communication concepts
- respect release / visibility states so families only see information that is meant for them
- support both **single-child** and **multi-child** families

## 2. Scope Source

The parent-portal scope comes from the **Parent / Family Member** section of the feature priority map. Build **all high-priority and medium-priority** items. Do **not** include low-priority items in this phase.

### Included features from the priority map

#### Visibility into Child's Learning
- Portfolio feed — high
- Unit plan visibility — high
- Classroom activity updates — high
- Progress reports — high
- Assessment results — high
- Attendance records — high
- Learning journey over time — high

#### Communicate with School
- 1:1 messaging with teacher — medium
- Channel participation — medium
- Announcements — high
- Translation — high
- Notification preferences — high

#### Manage Family Account
- Multi-child management — high
- Profile management — high
- Student sign-in code — high
- Language switching — high
- School policies — high
- Event calendar — high
- Assignments & deadlines — high

### Explicitly excluded from this phase
- Voice messages — low priority, out of scope for this build

## 3. Product framing

The parent portal is **not** a simplified teacher portal and **not** a duplicate of the student portal.

It should answer five family questions clearly:
1. **What is my child learning right now?**
2. **How is my child doing?**
3. **What should I know or act on today?**
4. **How do I communicate with the school?**
5. **How do I manage my family account and multiple children?**

In an IB context, the portal should surface **learning process**, not just grades:
- portfolios and classroom updates matter as much as assessment results
- unit context matters when available
- reports should feel holistic and narrative, not like a sterile data dump
- families should understand the child’s journey across time, classes, units, and evidence of learning

## 4. Core experience principles

1. **Family-first clarity**
   - Families are not power users. The default view should be readable in seconds.
   - Use plain language and avoid teacher/admin jargon.

2. **Visibility without overload**
   - Families should see only what is relevant to their linked child or children.
   - Do not expose internal teacher workflows, staff-only notes, moderation data, or draft content.

3. **Programme-aware, not planner-heavy**
   - Show useful curriculum context when it helps families understand learning.
   - Do not expose full teacher planning documents or internal planning fields.

4. **One portal for both daily awareness and deep review**
   - It should work for quick daily check-ins on mobile and deeper review on web.

5. **Trust through intentional release**
   - Families should only see published / shared / released information.
   - If something is not explicitly ready for family view, it should not appear.

## 5. Information architecture

Use a family-facing IA, not a teacher-style module list.

### Primary navigation
- Home
- Learning
- Assessments
- Reports
- Attendance
- Messages
- Calendar
- More

### More
- School policies
- Account & preferences
- Student sign-in code
- Child management / switcher (if not always visible in top bar)

### Persistent shell requirements
- Child switcher always accessible
- Clear indication of currently selected child
- Optional “All children” mode where appropriate for high-level rollups only
- Notification center entry point
- Language switcher entry point
- Responsive design with mobile-first considerations

## 6. Global visibility and permission rules

These are product requirements for the parent portal.

### Families can see
- their linked child or children only
- published announcements
- family-visible portfolio items / learning evidence
- classroom activity updates intended for families
- distributed / published progress reports
- released assessment results
- attendance records meant for family view
- upcoming assignments and deadlines
- school calendar events and school policies
- parent-enabled messaging / channels where the school allows it

### Families must never see
- teacher private notes
- internal support / incident records
- moderation or internal assessment workflow states
- draft reports
- unreleased grades or teacher-in-progress grading
- full teacher planning documents
- teacher-only lesson notes, reflections, differentiation notes, or staff collaboration details
- peer student data
- school-admin configuration surfaces

### Family-safe curriculum visibility
Unit / curriculum visibility should be **summary-level** only:
- visible: unit title, short family-facing summary, dates, relevant subject / course, key learning focus, optionally standards / ATL / learner-profile / inquiry context depending on programme
- hidden: internal strategy notes, teacher reflections, lesson activity internals, staffing / planning metadata

### Assessment visibility
Families should see results only when explicitly shareable:
- released score / band / level / criteria result where applicable
- teacher feedback / rubric breakdown if released
- submission status if the school wants parents to track it
- due date, title, class, unit context, status
- never show drafts, hidden grades, or staff-only annotations

## 7. Child model and multi-child behavior

### Multi-child management
This is a top-level requirement, not a nice-to-have.

Support:
- one parent linked to multiple children
- one child potentially linked to multiple family members
- quick child switching from top bar / header
- optional “All children” summary on Home, Messages, Announcements, Calendar, and Notifications
- all detailed academic views remain scoped to a single child at a time unless the content is naturally aggregate

### Child switcher behavior
- Show child avatar / initials, name, grade / class summary
- Persist selected child during navigation
- Allow “All children” for cross-child overview cards, inbox, and calendar
- Do **not** show combined academic detail views that mix data from multiple children into a single assessment/report table

## 8. Route / screen inventory

## Home
Purpose:
- the default family dashboard
- answer “what’s new, what matters, what’s next?”

Sections:
- child switcher
- welcome / current child header
- new learning highlights
- latest classroom activity updates
- unread announcements
- upcoming deadlines
- upcoming events
- latest released assessment result
- latest report / report available
- attendance alerts or recent attendance summary
- quick links to messages, policies, calendar

States:
- single child home
- all children overview
- empty state when no recent activity
- “school has not enabled this feature” state where needed

## Learning
Purpose:
- show the child’s visible learning story beyond grades

Tabs / segments:
- Portfolio feed
- Classroom updates
- Units
- Timeline / Learning journey

### Portfolio feed
Must support:
- cards for photo / video / document / text evidence
- teacher caption / student reflection / timestamp
- class and subject context
- optional tags: unit, subject, learning goals, standards / ATL / learner-profile indicators when available
- comments are optional only if family comments are intentionally in scope; otherwise read-only
- filters by class, subject, time period, type
- detail drawer / page for a single evidence item

### Classroom activity updates
Must support:
- stream of family-visible class updates
- teacher posts about what the class is doing
- attachments and media
- class / subject context
- reactions are out of scope unless already standard elsewhere
- clear distinction between “portfolio evidence about my child” and “general class update”

### Unit plan visibility
Must support:
- list of current and recent units for the selected child’s classes
- family-facing unit summary
- start/end dates
- subject / course
- what students are exploring / learning focus
- key vocabulary / concepts / inquiry / ATL / standards only if available and appropriate
- linked assessments and related portfolio evidence

Must **not** show:
- full teacher planner
- lesson-by-lesson internal planning
- teacher notes or reflections

### Learning journey over time
Must support:
- chronological timeline of the child’s learning
- entries can include portfolio evidence, classroom updates, released assessment milestones, report publication, attendance milestones, and key events
- filters by term, class, subject, unit, and content type
- option to switch between timeline and grouped views
- this is a core synthesis surface, not just a data export

## Assessments
Purpose:
- help families understand what is due and what has been released

Tabs / segments:
- Upcoming / Active
- Past / Completed
- Results

### Upcoming / Active
Must support:
- assignment / assessment title
- class / subject
- due date and status
- unit context when present
- whether work is submitted / pending / overdue if the platform has that state available
- drill-in to family-safe detail page

### Results
Must support:
- released results only
- per-assessment card or row
- display that adapts to grading model:
  - score / total
  - rubric result
  - standards / mastery view
  - MYP criteria view
  - DP scale / level if applicable
  - checklist / outcome view
- teacher feedback
- released attachments / exemplars if present
- trend or summary widgets for the child only, avoiding comparative class analytics

### Assessment detail
Must support:
- title, class, date, due date
- family-facing instructions or description
- unit link when available
- result summary (when released)
- rubric / criteria breakdown (when available)
- feedback
- submission state if available
- related evidence / portfolio items if linked

## Reports
Purpose:
- provide access to holistic progress reporting

Must support:
- list of published / distributed reports
- cards with reporting cycle, term, date, status
- detailed report view
- family-friendly print / export-ready layout
- narrative sections
- subject / course sections
- attendance summary where appropriate
- linked evidence / portfolio references where available
- read receipt is optional but desirable

## Attendance
Purpose:
- provide a simple, trustworthy attendance record for the child

Must support:
- daily / session attendance history
- summary cards (present / absent / late / excused)
- filters by date range and class where applicable
- notes only if they are intended for family visibility
- absence patterns or alerts at family-safe level
- no staff-only internal notes

## Messages
Purpose:
- central communication hub for direct and group family communication

Tabs / segments:
- 1:1 messages
- Channels
- Announcements

### 1:1 messaging with teacher (medium priority, but in scope)
Must support:
- asynchronous thread-based messaging
- child / class context in the thread
- teacher participant identity
- read states
- attachments if available elsewhere in the platform
- restricted availability if school disables direct messaging

Should avoid:
- chat-app complexity
- voice notes
- advanced escalation workflows

### Channel participation (medium priority, but in scope)
Must support:
- read and participate in family-enabled channels
- class channels, extracurricular channels, PTM / cohort channels where school enables them
- threaded or linear channel view, consistent with platform communication model
- moderation-safe input states
- ability to mute notifications per channel

### Announcements
Must support:
- school-wide and class-level announcements
- read / unread state
- attachments
- search and filters
- mark all as read
- pin / highlight urgent items where needed
- email mirror or email send indicator if part of school workflow

### Translation
Translation is a first-class communication feature, not a separate page.

Apply translation support to:
- announcements
- direct messages
- channel posts
- school policies if feasible
- possibly classroom updates if the school enables translation there

Requirements:
- show translated content on demand or by preference
- preserve access to the original text
- label translated language clearly
- allow family default language preference

## Calendar
Purpose:
- give families a clear view of what is coming up

Tabs / segments:
- School calendar
- Child schedule
- Deadlines

### Event calendar
Must support:
- school events
- class events
- parent-facing meetings / PTMs if available
- filters by child and class
- month and agenda views
- event detail page / drawer
- attachments / location / meeting link when relevant

### Assignments & deadlines
Must support:
- unified deadline list across the selected child’s classes
- filters by class, due date, status
- upcoming vs overdue
- drill-in to the linked assessment detail
- “All children” deadline rollup for multi-child families

## More

### School policies
Must support:
- list of published policies / handbooks / important documents
- categories
- search
- downloadable attachments
- acknowledgement state is optional if not already part of the platform

### Profile management
Must support:
- family member profile details
- contact info
- preferred language
- notification preferences
- linked children overview
- sign-in method visibility if relevant
- session / device management is optional

### Student sign-in code
Must support:
- child-specific sign-in / pairing code surface
- QR and/or text code if school workflow supports it
- explanatory copy about what the code is for
- visibility / expiry behavior if applicable
- only show when school/admin has enabled it

### Notification preferences
Must support:
- per-child and all-child preference management
- toggles for announcements, messages, classroom updates, portfolio updates, assessment results, attendance alerts, reports, event reminders, deadlines
- delivery channels: in-app, email, push where available
- digest vs instant where the platform supports it
- quiet hours optional

### Language switching
Must support:
- persistent UI language preference
- translation preference for communication surfaces
- family-set preference independent of school default

## 9. IB-specific expectations

The parent portal must work across IB-flavoured contexts and should be **programme-aware when metadata exists**.

### PYP-like context
If present, family-facing unit visibility can show:
- transdisciplinary theme
- central idea
- lines of inquiry
- learner profile / ATL emphasis
- visible learning evidence tied to the unit

### MYP-like context
If present, family-facing visibility can show:
- subject group / course
- unit title
- concepts / statement of inquiry in family-safe language
- ATL focus
- criteria-based assessment results when released

### DP-like context
If present, family-facing visibility can show:
- course
- assessment component / task type
- released performance and feedback
- deadlines and reporting milestones

General rule:
- expose helpful programme context
- hide teacher-authored internal planning detail

## 10. Dashboard card requirements

The Home screen should be card-based and prioritize actionability.

Required cards:
- New learning this week
- Recent classroom updates
- Upcoming deadlines
- Upcoming events
- Latest announcements
- Latest report / report available
- Recent assessment result
- Attendance snapshot
- Message inbox summary

For multi-child families:
- cards may aggregate counts, but click-through should land in filtered child- or child-select flows

## 11. Search, filters, and drill-down behavior

Global expectations:
- search where content volume becomes meaningful
- useful filter chips, not dense admin filters
- drawers are preferred for quick details
- full pages for heavy reading surfaces like reports, messages, policies, and deep learning timelines

Minimum filter coverage:
- child
- class / subject
- date range / term
- content type
- read / unread where relevant
- status where relevant

## 12. Notifications model

A family portal without notifications will feel incomplete.

Support notification objects for:
- new announcement
- new direct message
- new channel activity where family is a member
- new portfolio evidence / classroom update about the child
- new report published
- released assessment result
- attendance issue / absence notification
- upcoming deadline reminder
- upcoming event reminder

Notification center requirements:
- unread count
- mark as read
- deep-link into the relevant detail view
- child context visible on every notification
- filters by child and type

## 13. Empty states and blocked states

Design for the following:
- no children linked yet
- school has not enabled family messaging
- no released assessment results yet
- no reports published yet
- no attendance issues / no attendance records yet
- no current unit information shared yet
- no portfolio updates yet
- no policies uploaded yet

Every empty state should explain the situation in plain language and, where appropriate, tell the family whether the feature depends on school setup.

## 14. UX and design requirements

The parent portal must reuse the existing platform design language:
- warm, calm, professional tone
- Peach accent
- same typography, spacing, layout logic, and accessibility standards
- low cognitive load
- progressive disclosure
- one primary action per region
- right-drawer pattern for lightweight details / edits
- mobile-friendly, but consistent with web shell

Family-specific UX additions:
- stronger emphasis on readability and reassurance
- more timeline/feed patterns than dense management tables
- fewer teacher-like configuration actions
- family-safe language and status labels

## 15. Accessibility and inclusivity requirements

Must include:
- accessible navigation and focus states
- readable contrast
- plain-language labels
- translation-aware communication UX
- support for families checking quickly on mobile
- no reliance on color alone for statuses
- clear labels for translated vs original content
- readable date / time context and timezone-aware display

## 16. Out of scope

Do not build in this phase:
- voice messages
- parent payments / billing
- transport tracking
- medical / nurse workflows
- behavior / incident management visible to families unless explicitly requested later
- complex approval workflows
- advanced analytics comparing the child against peers
- admin roster management surfaces
- family-side editing of academic records
- any school-wide control panel

## 17. Delivery expectations for Codex

Produce a coherent parent portal that feels product-complete at prototype level.

### Expected output
- family-facing route structure
- reusable shell and navigation
- realistic mock data across one-child and multi-child families
- mobile-responsive layouts
- clear empty, loading, unread, and disabled states
- child switcher behavior
- notification center
- key flows across Home, Learning, Assessments, Reports, Attendance, Messages, Calendar, and More
- product-consistent communication and visibility rules

### Important implementation guidance
- integrate conceptually with the teacher and student portals, but do not spend time documenting codebase wiring
- assume shared identity / data concepts across personas
- prefer family-safe read models over exposing raw teacher objects
- prioritize high-priority surfaces first, but do include the medium-priority communication features in this build
- keep the UI calm and supportive rather than dashboard-heavy

## 18. Recommended build sequence

### Phase 1 — shell, identity, family-safe read model
- family shell
- child switcher
- home dashboard
- announcements
- policies
- calendar
- notification center
- profile + language + notification preferences

### Phase 2 — core learning visibility
- portfolio feed
- classroom updates
- units
- learning journey over time
- reports
- attendance
- assignments & deadlines

### Phase 3 — academic detail and communication
- assessment results
- assessment detail
- 1:1 messaging
- channel participation
- translation across communication surfaces
- student sign-in code

## 19. Acceptance criteria

The build is successful when:
- a family can sign in and immediately understand which child they are viewing
- a multi-child family can switch children cleanly and see cross-child summaries where appropriate
- the portal shows a meaningful learning story, not only grades
- published announcements, family-visible learning updates, reports, attendance, and deadlines are all discoverable
- assessment results are visible in a family-friendly way, only when released
- communication features exist without overwhelming the portal
- unit visibility adds context without exposing teacher planning internals
- the experience feels like part of the same product family as teacher and student
- the feature set fully covers the non-low-priority parent scope from the priority map

## 20. Source appendix

### Priority-map source used for scope
Parent / Family Member rows extracted from `Toddle_Feature_Priority_Map.numbers`:
- Visibility into Child's Learning → Portfolio feed (high)
- Visibility into Child's Learning → Unit plan visibility (high)
- Visibility into Child's Learning → Classroom activity updates (high)
- Visibility into Child's Learning → Progress reports (high)
- Visibility into Child's Learning → Assessment results (high)
- Visibility into Child's Learning → Attendance records (high)
- Visibility into Child's Learning → Learning journey over time (high)
- Communicate with School → 1:1 messaging with teacher (medium)
- Communicate with School → Channel participation (medium)
- Communicate with School → Announcements (high)
- Communicate with School → Translation (high)
- Communicate with School → Voice messages (low)
- Communicate with School → Notification preferences (high)
- Manage Family Account → Multi-child management (high)
- Manage Family Account → Profile management (high)
- Manage Family Account → Student sign-in code (high)
- Manage Family Account → Language switching (high)
- Manage Family Account → School policies (high)
- Manage Family Account → Event calendar (high)
- Manage Family Account → Assignments & deadlines (high)

### External product-shaping references
- https://www.toddleapp.com/ib-myp/
- https://play.google.com/store/apps/details?id=com.toddle.family
- https://support.toddleapp.com/en/articles/8612349-how-do-i-sign-in-to-my-family-account-using-google-microsoft-or-any-other-email-id-phone
- https://support.toddleapp.com/en/articles/8611846-how-to-invite-family-members-on-toddle-as-an-admin
- https://www.toddleapp.com/privacy-policy/
