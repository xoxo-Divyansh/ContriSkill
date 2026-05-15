# Design Direction

- **Purpose:** Define the approved visual direction for ContriSkill based on the SkillBridge inspiration and translate it into implementation-ready UI system guidance.
- **Owner:** Product Design + Engineering
- **Status:** Draft
- **Related docs:** `design-system.md`, `wireframe-notes.md`, `../03-engineering/sprint1-checklist.md`, `../01-product/contribution-engine.md`, `../02-architecture/api-spec.md`
- **Reference UI:** `references/skillbridge-reference-ui.png`

## 1. Direction Summary

ContriSkill should adopt the reference UI's:

- clean dashboard-first composition
- card-driven information architecture
- calm visual hierarchy
- soft elevation and approachable interaction model

ContriSkill should evolve it toward:

- stronger trust clarity
- more explicit contribution lifecycle states
- higher information density discipline for collaboration workflows
- premium reliability cues over generic marketplace aesthetics

## 2. Reference UI Analysis

## 2.1 Visual Philosophy

Observed:

- minimal, bright, neutral canvas
- teal/green primary accent for actions
- friendly but structured visual tone

ContriSkill direction:

- keep clean/minimal baseline
- increase trust seriousness with stronger semantic state colors (verified, disputed, moderation)
- reduce decorative visuals on workflow-heavy screens

## 2.2 Layout Rhythm

Observed:

- predictable grid
- left rail navigation + central work surface + optional right utility panel
- sectioned vertical rhythm using cards and headings

ContriSkill direction:

- keep 3-zone dashboard logic
- reserve right panel for time-sensitive trust actions (verification, disputes, pending reviews)
- enforce consistent section spacing cadence across all pages

## 2.3 Card System Behavior

Observed:

- most content is card-based
- cards group metrics, activities, profiles, sessions, forms

ContriSkill direction:

- keep card system as primary composition primitive
- define card roles:
  - metric cards
  - lifecycle cards
  - identity/trust cards
  - action cards
- card components must support explicit state badges and trust metadata

## 2.4 Typography Hierarchy

Observed:

- clear heading/body hierarchy
- modern sans typography
- compact but readable metric text

ContriSkill direction:

- preserve strong heading hierarchy and compact body text
- ensure trust-critical values (reputation, credits, verification state) use high-contrast, semantically stable typography
- avoid oversized marketing typography in authenticated app surfaces

## 2.5 Spacing System

Observed:

- consistent spacing around cards, section titles, controls
- comfortable but not sparse density

ContriSkill direction:

- enforce tokenized spacing only
- apply tighter density inside workflow cards, looser density in marketing/public pages
- standardize paddings by container type (page, panel, card, control group)

## 2.6 Dashboard Structure

Observed:

- welcome/header row
- quick stats row
- active workflow panels
- side utilities and recommendations

ContriSkill direction:

- top row: identity and current trust posture
- second row: active lifecycle actions (needs verification, pending response, dispute queue)
- third row: context (activities, suggestions, profile health)

## 2.7 Navigation / Sidebar Philosophy

Observed:

- persistent left nav with clear icon+label items

ContriSkill direction:

- keep persistent workspace navigation for authenticated flows
- order nav by contribution lifecycle, not by generic social grouping
- include visible trust/safety entry points (disputes, moderation status, audit history where applicable)

## 2.8 Form / Input Styling Direction

Observed:

- large, rounded, approachable fields
- clear sectioning in long forms

ContriSkill direction:

- keep clear form chunking with progressive disclosure
- add stricter error/validation semantics for trust-impacting fields
- ensure all state styles (default/focus/error/disabled) are tokenized and uniform

## 2.9 Button Philosophy

Observed:

- primary gradient/accent CTA
- secondary ghost/light actions

ContriSkill direction:

- keep strong primary CTA hierarchy
- reserve high-emphasis buttons for irreversible or trust-affecting actions
- define destructive/warning button treatments early for dispute/moderation interactions

## 2.10 Trust / Reputation Visibility

Observed:

- trust shown as rating and metric snippets

ContriSkill direction:

- expand trust surfaces beyond star ratings:
  - verification status
  - completion rate
  - credits trajectory
  - moderation flags (policy-permitted)
- trust indicators must be explainable and context-linked, not purely decorative

## 2.11 Elevation / Shadows

Observed:

- subtle, soft shadows
- shallow elevation stack

ContriSkill direction:

- keep low-elevation baseline
- use elevation only to signal interaction layer or urgency
- avoid deep shadow stacks that create visual noise

## 2.12 Border Radius Philosophy

Observed:

- medium-soft radii across cards and controls

ContriSkill direction:

- keep soft radius style for approachability
- standardize radius scale; no ad-hoc rounding values
- avoid overly rounded "playful" shapes in trust-critical views

## 2.13 Interaction Feel

Observed:

- calm, quick, non-intrusive interaction model

ContriSkill direction:

- preserve lightweight feedback
- prioritize deterministic interaction cues for workflow transitions
- avoid novelty interactions that reduce state clarity

## 2.14 Information Hierarchy

Observed:

- clear top-to-bottom narrative from summary to detail

ContriSkill direction:

- first screenful must answer:
  - what needs my action now
  - what is my current trust state
  - what collaboration step is next
- keep recommendations secondary to active obligations

## 2.15 Accessibility Direction

ContriSkill baseline direction:

- keyboard-first operability for all primitives
- visible focus rings on all interactive elements
- color contrast suitable for trust-critical text and status chips
- semantic heading/order consistency in dashboard and forms
- avoid color-only status communication

## 3. What to Adopt vs What Not to Copy

## 3.1 Adopt

- modular card grid composition
- clear sidebar + workspace shell
- concise metric blocks
- restrained color palette with one primary accent family
- form chunking with visible section labels

## 3.2 Do Not Copy Directly

- generic mentor marketplace framing
- decorative hero illustration density in product workspace
- trust represented mostly as star rating
- recommendation-heavy emphasis over active workflow obligations

## 3.3 ContriSkill Evolution (Premium + Trust-Oriented)

- introduce explicit lifecycle state surfaces everywhere collaboration occurs
- encode trust signals as structured, explainable status components
- bias layout toward "action required now" and "state changed since last visit"
- maintain premium restraint: clean surfaces, controlled motion, high semantic clarity

## 4. Sprint 1 Step 8 Primitive Design Principles

These principles govern `packages/ui/src/primitives/*`:

- **Button:** clear variant hierarchy (`primary`, `secondary`, `destructive`, `ghost`), semantic loading/disabled states.
- **Input:** consistent focus/error/disabled behavior; no feature-specific formatting logic.
- **Label:** semantic pairing with form controls; required/optional indicators standardized.
- **Card:** configurable header/body/footer slots with tokenized spacing and border/elevation options.
- **Stack / Container:** layout primitives with deterministic spacing and alignment contracts.
- **Text:** semantic typography roles (`title`, `subtitle`, `body`, `caption`, `metric`) mapped to tokens.

Rules:

- primitives must stay domain-agnostic
- no API calls or business state coupling
- all sizing, spacing, color, radius, shadow from tokens only

## 5. Future Dashboard Composition Philosophy

- use predictable modules:
  - trust summary rail
  - active lifecycle queue
  - collaboration activity timeline
  - secondary discovery/recommendation pane
- prioritize unresolved obligations over exploration content
- persist contextual trust indicators at module headers

## 6. Visual Consistency Rules

- one source of truth: token values in `packages/ui/src/tokens/*`
- no raw hex/radius/shadow literals in feature UI
- component states must be consistent across web routes
- trust state colors and badges must be semantically stable across screens
- avoid introducing one-off card/button variants without primitive extension review

## 7. Token Usage Guidance

- `colors`: semantic roles first (`surface`, `text`, `border`, `brand`, `status`)
- `spacing`: use scale values only; no arbitrary margins/paddings
- `typography`: apply role-based text styles, not ad-hoc font overrides
- `radius`: use shared radius scale for cards/controls/chips
- `shadows`: reserve stronger shadows for overlays and high-priority surfaced actions

## 8. Motion and Animation Direction

- motion goals:
  - communicate state transition
  - confirm action
  - reduce abrupt layout shifts
- keep transitions short and subtle
- avoid continuous decorative animation in dashboard contexts
- trust-critical state changes should prefer clarity over flourish

## 9. OPEN DECISION

- What exact semantic status color map should be used for `verified`, `pending`, `disputed`, and `under_moderation`?
- Should moderation-related trust signals be fully visible in profile-level cards for MVP, or partially redacted?
- What is the final accessibility target (WCAG AA baseline vs stricter internal contrast thresholds) for Sprint 1 primitives?
- Should dashboard right-rail recommendations be collapsible by default in favor of action queues?
- What motion tokens (duration/easing) become the default for primitive interactions in MVP?
