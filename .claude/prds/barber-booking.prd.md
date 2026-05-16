# Barber Booking — MVP

## Problem
Customers booking at a small barbershop today call the shop or stop by; staff record the visit on paper. This loads the phone during busy hours, gives the manager no remote visibility into the day's pipeline, and gives customers no way to confirm their reservation without calling again.

## Evidence
- Shop currently logs each visit by hand in a paper notebook (barber name / service / income).
- Manager has tried spreadsheets, but the source data still originates on paper, so the spreadsheet inherits whatever the barber wrote — including the occasional missed or wrong entry.
- Typical day has 1–3 barbers working; visit volume is small but each missed entry is a meaningful share of the day.
- **MVP-specific assumption**: customers will prefer a web form to a phone call. *Needs validation via* a live trial after launch — count web bookings vs. phoned-in bookings over the first two weeks.

## Users
- **Primary — Customer**: First-time or returning visitor who wants to lock in a time without calling. Identified only by phone number in MVP.
- **Primary — Admin (shop owner / online manager)**: Configures shop hours and closed days; needs those rules respected by the customer-facing calendar and time dropdown.
- **Not for**: Multi-shop chains, walk-in queue management, customers without a phone number, customers who want to pick a specific barber or service (deferred).

## Hypothesis
We believe **an online booking form with phone-only identity and a phone-lookup page** will **let customers self-book within shop hours and retrieve their reservation without staff** for **regulars and first-time customers of a single small barbershop**.
We'll know we're right when **a meaningful share of bookings arrives through the web (target TBD — needs baseline call volume) AND customers can retrieve their booking via the lookup page without contacting staff**.

> **Scope note**: This MVP intentionally does **not** address the manager's stated income-tracking / paper-notebook pain. That is the *larger* product hypothesis — this MVP builds the booking foundation that later milestones will hang accounting on.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Share of bookings created via web vs. phone | TBD — needs baseline call volume | Compare web booking count to staff-logged phone bookings over 2 weeks post-launch |
| Self-service lookup success | ≥ 80% of returning visits | Customers retrieve their booking via the lookup page without calling the shop |
| Calendar / dropdown respects admin rules | 100% | Spot-check: no slots offered on closed days, no slots outside open hours, no slots beyond today + 13 days |

## Scope
**MVP** — A single barbershop where:
- Admin sets one daily open time and one daily close time, applied to every open day.
- Admin sets one recurring weekly closed day (e.g., closed every Monday).
- Admin adds specific one-off closed dates on top of the weekly rule.
- Customer enters phone number, picks a date within today → today + 13 days, and picks a 30-minute time slot between open and close.
- Customer enters phone number on a lookup page to see bookings tied to that number.

**Out of scope (deferred to post-MVP)**
- Per-barber income / accounting tracking — the original manager pain. Deferred so we can ship the booking foundation first.
- Barber selection — single-chair model in MVP.
- Service selection — generic appointment slot only.
- Customer authentication (Google or otherwise) — phone-only.
- Booking cancellation, rescheduling, status workflow (pending / confirmed / completed / no-show).
- Notifications (SMS / LINE / email).
- Online payment.
- Multi-shop support.
- Admin-side booking creation or walk-in entry.
- Customer name capture beyond phone.

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Shop hours and closed days configurable | Admin can set open/close times, the weekly closed day, and one-off closed dates; these rules are persisted and ready to constrain the booking UI | in-progress | [.claude/plans/barber-booking-shop-hours.plan.md](.claude/plans/barber-booking-shop-hours.plan.md) |
| 2 | Customer can book a slot | A visitor enters phone + date + time and a booking is recorded; the date picker is bounded to today → today + 13 days and skips admin closed days; the time dropdown only offers 30-minute slots within open hours | in-progress | [.claude/plans/barber-booking-customer-booking.plan.md](.claude/plans/barber-booking-customer-booking.plan.md) |
| 3 | Customer can look up bookings by phone | A returning visitor enters their phone number and sees the bookings tied to it | pending | — |

## Open Questions
- [ ] Should the lookup page rate-limit or otherwise prevent strangers from enumerating bookings by guessing phone numbers? Phone-only identity is privacy-sensitive.
- [ ] If a phone number already has a future booking, can it create another? Allow unlimited, cap at one active, or something else?
- [ ] What happens if two customers try to book the same slot at the same instant? Concurrency rule needs a decision before implementation.
- [ ] Timezone — assumed Asia/Bangkok? Confirm.
- [ ] Language — Thai, English, or both on the public pages?
- [ ] How does the admin authenticate? Single seeded email/password account, or something simpler for MVP?
- [ ] Is open/close time one pair for the whole week, or different per weekday? Current read: one pair, every open day — please confirm.
- [ ] Phone number format — Thai 10-digit only, or international? Validation rule?
- [ ] Retention policy for stored phone numbers, given PII implications?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MVP doesn't solve the originally stated manager pain (paper-notebook income), so the stakeholder may feel the launch is missing the point | Medium | Medium | Make the post-MVP roadmap explicit; line up income-tracking as the next milestone after MVP ships |
| Phone-only lookup → anyone with a guessed phone number can view someone else's booking | High | Medium-High | Decide on a safeguard before launch (rate limiting, partial-info display, or accept the risk for a closed customer base) |
| No-show rate may climb without reminders | Medium | Low (in MVP) | Track no-shows manually; revisit notifications post-MVP if the rate becomes problematic |
| Two customers create overlapping bookings on the same slot due to race | Low (low volume) | Medium | Server-side conflict check at create time; pick the strategy before implementation |
| Scope creep — pressure to add barbers / services / income tracking before MVP ships | Medium | High | The "Out of scope" list above is the line; new asks land in v1.1 |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
