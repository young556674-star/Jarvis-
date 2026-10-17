# J.A.R.V.I.S. Firestore Security Specification

## 1. Data Invariants
- Users can only read, write, and list their own subcollections (/users/{userId}/*) where `request.auth.uid == userId`.
- All writes must come from an authenticated user (`request.auth != null`).
- Unauthenticated or cross-user writes/reads must be strictly rejected (`PERMISSION_DENIED`).
- Document IDs must satisfy `isValidId(id)` pattern `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
- In subcollections, the `userId` field in the payload must strictly match the route parameter `userId` and `request.auth.uid`.
- Timestamps and required keys must be verified; ghost fields are rejected on create.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/users/user_123/tasks/task_1` without authentication.
2. **Unauthenticated Write**: Attempting to create `/users/user_123/tasks/task_1` without authentication.
3. **Cross-User Snooping**: User `user_abc` attempting to read `/users/user_xyz/memories/mem_1`.
4. **Cross-User Injection**: User `user_abc` attempting to create `/users/user_xyz/tasks/task_1`.
5. **ID Poisoning**: Attempting to write a document with an ID containing malicious symbols or exceeding 128 characters (e.g., `../../hack`).
6. **Identity Spoofing**: User `user_abc` creating a memory document where `userId: "user_xyz"`.
7. **Shadow Update (Ghost Fields)**: Injecting unauthorized root fields (e.g. `isAdmin: true` or `role: "admin"`).
8. **Oversized String Bomb**: Injecting a 2MB string into `title` or `content` to induce denial of wallet.
9. **Invalid Enum Poisoning**: Setting `priority` on a task to `"ultra_supreme_bypass"` instead of `high|medium|low`.
10. **Negative Progress Number**: Setting `progress` on a project to `-999` or `"one hundred"`.
11. **Subcollection Hijack**: Modifying immutable `id` or `userId` in an existing document.
12. **Blanket Collection Scrape**: Attempting a root wildcard collection query without scoping to authenticated user's documents.

## 3. Test Runner
All payloads tested against ruleset verifying `PERMISSION_DENIED` on invalid operations and authorization boundary violations.
