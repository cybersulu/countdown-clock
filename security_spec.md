# Security Specification & Threat Model

## 1. Data Invariants
- An event MUST be created by an authenticated user whose email is verified.
- The user creating the event MUST be on the allow-list (either having a record in `/allowlist/$(request.auth.uid)` or email matching the bootstrap admin `pete.teoh@gmail.com`).
- The `createdByUid` on the incoming event MUST strictly match `request.auth.uid`.
- The `createdByEmail` on the incoming event MUST strictly match `request.auth.token.email`.
- Event titles must be strings between 1 and 100 characters.
- Event descriptions must not exceed 500 characters.
- Event `targetDate` must be a valid ISO string <= 50 characters.
- Event `alarmSound` must be one of `['chime', 'bell', 'urgent', 'fanfare', 'zen', 'radar']`.
- Event deletions are only allowed by the creator or an admin (`pete.teoh@gmail.com`).
- Public read access is permitted for events so visitors can see countdown clocks.
- Updates to an event must preserve `createdByUid`, `createdByEmail`, and `createdAt`.
- Allowlist documents can only be modified by the admin (`pete.teoh@gmail.com`).

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Write**: Anonymous or unauthenticated client attempting to create an event in `/events/{eventId}`.
2. **Non-Allowlisted Write**: Authenticated user with email `hacker@random.com` (not on allow-list) attempting to create an event.
3. **Identity Spoofing**: User with UID `alice-123` submitting payload with `createdByUid: 'bob-456'`.
4. **Email Spoofing**: User submitting an event with `createdByEmail: 'pete.teoh@gmail.com'` while their actual token email is `mallory@gmail.com`.
5. **Denial of Wallet Payload**: Event title containing 50,000 characters to bloat database storage.
6. **Invalid Alarm Enum**: Event with `alarmSound: "malicious_script_inject"`.
7. **Ghost Field Injection (Shadow Update)**: Updating an event with an undeclared property `isAdmin: true` or `ghostField: 123`.
8. **Immutability Breach**: An update payload attempting to reassign `createdByUid` or `createdAt`.
9. **Unverified Email**: User whose `email_verified` is `false` attempting to write.
10. **Path Variable Poisoning**: Writing to an event with a 2,000 character illegal document ID.
11. **Unauthorized Allowlist Escalation**: Non-admin user attempting to write a new allowlist entry for their own email.
12. **Unauthorized Event Deletion**: Authenticated user attempting to delete another user's event.

## 3. Threat Mitigation Summary
All 12 vectors are mitigated using explicit `isValidId()`, `isValidCountdownEvent()`, `isAllowlisted()`, `isAdmin()`, `hasOnly()`, and strict field type and length checks.
