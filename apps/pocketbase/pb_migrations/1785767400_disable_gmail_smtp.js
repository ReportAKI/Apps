/// <reference path="../pb_data/types.d.ts" />

// Disables custom SMTP and reverts to the platform relay (which works reliably).
// The previous Gmail SMTP migration used an invalid App Password causing 535 errors.
// To re-enable Gmail SMTP later, provide a valid 16-character App Password from:
// Google Account → Security → 2-Step Verification → App Passwords

migrate(
  (app) => {
    const s = app.settings();
    s.smtp.enabled = false;
    s.meta.senderName = "ReportAKI Support";
    app.save(s);
  },
  (app) => {
    // no-op rollback
  }
);
