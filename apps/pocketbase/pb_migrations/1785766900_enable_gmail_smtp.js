/// <reference path="../pb_data/types.d.ts" />

// Custom SMTP via Gmail — removes hsend.ai relay entirely.
// REQUIRED: Replace GMAIL_APP_PASSWORD_HERE with a real Gmail App Password
// (16-char token from Google Account → Security → App Passwords).
// After adding the real password, reload the app for the migration to apply.

migrate(
  (app) => {
    const s = app.settings();

    s.smtp.enabled  = true;
    s.smtp.host     = "smtp.gmail.com";
    s.smtp.port     = 465;
    s.smtp.tls      = true;
    s.smtp.username = "ReportAKI.support@gmail.com";
    s.smtp.password = "6987262924TZA";

    s.meta.senderAddress = "ReportAKI.support@gmail.com";
    s.meta.senderName    = "ReportAKI Support";

    app.save(s);
  },
  (app) => {
    const s = app.settings();
    s.smtp.enabled = false;
    app.save(s);
  }
);
