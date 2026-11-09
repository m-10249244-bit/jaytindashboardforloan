# Security Specification - JayTIN Private Ledger

## Data Invariants
1. A ledger record must have a valid `ownerId` that matches the authenticated user.
2. `totalAmount` and `paidAmount` must be numbers.
3. `shareKey` must be at least 32 characters for security.
4. Users can only read/write their own records, except for public viewing via `shareKey`.

## The Dirty Dozen (Potential Vulnerabilities)
1. **Identity Spoofing**: Attempt to create a record with someone else's `ownerId`.
2. **State Shortcutting**: Attempt to forcefully set status to 'Settled' without full payment (Wait, the app logic handles this, but rules should protect against malicious writes). Actually, the user *is* the owner, so they can edit their own records.
3. **Ghost Field Injection**: Adding non-schema fields.
4. **ID Poisoning**: Using a massive string as `ledgerId`.
5. **Unauthorized Access**: Reading records without being the owner and without a valid `shareKey`.
6. **Public Exposure**: Querying records by `shareKey` without supplying the key (Brute forcing).
7. **Resource Exhaustion**: Writing 1MB strings into text fields.
8. **Public Write**: Attempting to write to a record via public access.
9. **Ownership Transfer**: Attempting to change the `ownerId` of an existing record.
10. **Admin Escalation**: Attempting to perform administrative actions without being an admin. (App doesn't have roles yet, but we'll secure it).
11. **Negative Amounts**: Setting `totalAmount` to a negative value.
12. **Timestamp Fraud**: Providing a fake `updatedAt` instead of `request.time`.

## Test Plan
- Verify `create` requires `auth.uid == ownerId`.
- Verify `read` allowed if `auth.uid == ownerId` OR `resource.data.shareKey == providedKey`.
- Verify `update` requires `immutable(ownerId)`.
- Verify `updatedAt` is `request.time`.
