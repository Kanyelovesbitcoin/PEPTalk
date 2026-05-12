# GlowPep TestFlight Release Checklist

## 1. First Launch

1. Install a fresh TestFlight build.
2. Confirm onboarding starts without any OS permission prompt.
3. Complete the rotation-led onboarding.
4. Dismiss the paywall to inspect the free path: Today, Library, Today's Rotation, local logs, Profile privacy controls.
5. Start trial or use the sandbox purchase flow to inspect Pro: deep questionnaire, saved shortlist, exports, reminders, and multiple saved shortlists.

## 2. Today's Rotation

- No active trackers shows the Library setup CTA.
- One active tracker appears in Today's Rotation when due.
- Multiple due trackers are ordered by scheduled time.
- Log marks the item as taken and advances the next pending tracker.
- Skip marks the item as skipped and advances the next pending tracker.
- Undo clears today's status and returns the tracker to the queue.
- A tracker with no amount opens setup instead of logging.
- No due trackers today shows the next upcoming tracker when available.

## 3. Tracker And Records

- Daily check-in saves and returns to Today.
- Routine setup requires user-entered amount, route, time, and safety confirmation.
- Free users can create local trackers and use Today's Rotation.
- Pro users can enable private reminders.
- Export JSON uses schema v2 and contains no image or visual-analysis fields.
- Amount CSV includes taken and skipped statuses.

## 4. App Store Framing

- No camera or photo permission appears in iOS settings.
- App copy frames GlowPep as private peptide education and tracking.
- GlowPep does not diagnose, treat, prescribe, recommend products, recommend amounts, or suggest sourcing.
- User-entered amounts and routes are clearly described as coming from the user's own record.
