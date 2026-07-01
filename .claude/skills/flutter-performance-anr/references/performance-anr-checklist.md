# Performance and ANR Checklist

- Startup only blocks on critical work.
- SDK initialization is lazy/background when not required before first frame.
- Heavy JSON, file, PDF, image, crypto, or compression work is off UI isolate.
- No HTTP/DB/I/O side effects in `build`.
- Dynamic lists use lazy builders or slivers.
- Avoid `shrinkWrap` for large/full-screen dynamic lists.
- Timers, stream subscriptions, controllers, and animations are disposed.
- Drift queries avoid N+1 and excessive UI-side composition.
- Blocking async work has timeout where user flow depends on it.
- Current plugin APIs are verified before recommending exact fixes.
