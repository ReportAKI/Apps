/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const s = app.settings();

    s.smtp.enabled  = true;
    s.smtp.host     = "smtp.gmail.com";
    s.smtp.port     = 465;
    s.smtp.tls      = true;
    s.smtp.username = "ReportAKI.support@gmail.com";
    s.smtp.password = "vged hauv vlcb wxev";

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
