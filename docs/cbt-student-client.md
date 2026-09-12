# Student CBT web client

## Entry and scope

Open `/cbt/:tenantId/:examId` using UUIDs from the scheduled exam. Students enter the eight-digit exam access ID and PIN issued by an exam officer. This route sits outside staff authentication and uses a separate API client. The backend enforces school tenant type, enrollment, exam access and device binding on every operation; non-school tenants cannot use it. The client resumes an existing attempt by default and does not expose retake creation.

This phase implements instructions, choice/text/essay/matching/ordering inputs, question navigation, flags, adjustable text, server-derived timing, answer recovery and final submission confirmation. Staff authoring screens remain separate. Grading and release are available through `/cbt-grading`; the student page displays the released score, percentage and pass status.

## Saving and recovery

Each change is committed to IndexedDB before transmission. A strict read/write transaction allocates its sequence and stores its immutable idempotency key. Retries reuse the original event. Only a server acknowledgement followed by a successful local transaction removes an event from the pending queue. Rejected events remain in a downloadable recovery record. PINs are never stored; scoped student credentials are retained for reload recovery. Sign-out clears credentials while preserving unsynced/rejected events for a subsequent sign-in on this device.

A Web Lock permits one exam tab per origin. Local storage remembers the device ID and last session; IndexedDB stores the paper, server answers and local events. Browsers require secure contexts, IndexedDB, Web Locks and persistent site storage. Clearing site data removes local recovery. Storage failures stop editing and show an invigilator message.

Free navigation works during a connection interruption. Sequential navigation waits for acknowledgement and server authorization. The timer uses a server timestamp plus monotonic elapsed time. A restarted or suspended page needs a fresh server time sample before editing resumes. Cached answers remain available; the server alone decides deadlines and submission state. Late events are retained for recovery and are never represented as accepted answers.

Submission first stops editing, flushes the queue and retrieves the latest server revision. The student then separately confirms the answered/unanswered/flagged totals. A revision conflict requires another review.

## Hosting

Set `VITE_API_BASE_URL` to the backend API root, including `/api/`. Student calls use `cbt/student` beneath it. Configure the host to serve `index.html` for student routes, serve `/cbt-sw.js` with JavaScript MIME type, and retain older hashed assets during rollout.

Production builds generate a service worker scoped to `/cbt/`. It caches the compiled application shell, never authenticated API responses. Updates wait for existing exam tabs to close. Offline reopening requires a successful previous shell installation; instructions show whether it is ready. HTTPS is required outside localhost. The existing combined application bundle produces a size warning; code splitting remains a performance improvement.

## Verification

`npm test` covers ten controller cases: durable offline recovery, lost acknowledgements, rapid edits, rejected events, expired credentials, changed device sessions, submission ordering, sign-out preservation, server sequence recovery and free navigation/time invalidation. `npm run build` and targeted ESLint checks pass.

A local fixture browser check verified PIN login, instructions, choice/flag saving, essay queuing during an API outage, closing/reopening with pending data intact and editing disabled until time verification, successful retry, confirmation counts and submitted state. This is not a real-backend browser integration or load test. Backend tests independently exercise production SQL in isolated PGlite; shared database migrations have not been applied.
