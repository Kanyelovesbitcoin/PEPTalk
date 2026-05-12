# GlowPep App Store Readiness Notes

## Review Narrative

GlowPep should be submitted as a private peptide education and tracking app. The review narrative should emphasize:

- Educational Library browsing with legal and safety labels.
- User-entered trackers, Today's Rotation, local logs, reminders, personal notes, and calculator utilities.
- Pro unlocks the deep guide, educational shortlist organization, exports, multiple saved shortlists, private reminders, and AI-assisted educational reasoning.
- GlowPep does not diagnose, treat, prescribe, recommend products, recommend amounts, suggest sourcing, or replace a licensed clinician.

## Store Description Draft

GlowPep is a private education and tracking app for adults who want to keep peptide-related research notes in one place. Users can browse an educational Library, create personal tracker entries, move through Today's Rotation, set discreet reminders, and save local logs. GlowPep does not diagnose, treat, prescribe, recommend products, recommend amounts, sell products, or replace a licensed clinician.

Free users can browse the Library, use Today's Rotation, keep local logs, and save personal notes. Pro users can start a trial for the deep questionnaire, AI-assisted educational organization, exports, multiple saved shortlists, and private reminders. AI features disclose when data is sent to the hosted API.

## Technical Notes

- Local-first storage for Library choices, logs, notes, schedules, recipes, profile name, guide answers, and saved shortlists.
- Expo web output is set to `server` so hosted Expo Router API routes can serve `/api/health` and `/api/ai-insights`.
- Notification permission is requested only after the user enables a reminder.
- No camera or photo permission is requested.
- RevenueCat configuration should be present for production purchase testing.

## Reviewer Demo Path

1. Complete rotation-led onboarding.
2. Dismiss the paywall to inspect the free path: Today, Library, Today's Rotation, local tracker, and Profile privacy controls.
3. Add a Library item to the tracker with a user-entered amount and schedule.
4. Log, skip, and undo a scheduled tracker from Today's Rotation.
5. Start trial or use the sandbox purchase flow to inspect Pro: deep questionnaire, saved shortlist, exports, reminders, and multiple saved shortlists.

## Screenshots

- Today screen with Today's Rotation.
- Log screen with horizontal rotation queue.
- Library detail with safety/legal context.
- Tracker setup sheet with user-entered amount and route.
- Profile privacy/control screen.
