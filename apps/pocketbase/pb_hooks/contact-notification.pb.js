/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record;
    const name = record.get("name");
    const email = record.get("email");
    const subject = record.get("subject");
    const message = record.get("message");

    const senderAddress = $os.getenv("BUILDER_MAILER_SENDER_ADDRESS") || $app.settings().meta.senderAddress;

    const notifyMessage = new MailerMessage({
      from: { address: senderAddress, name: "ReportAKI Support" },
      to: [{ address: "ReportAKI.support@gmail.com" }],
      subject: `Νέο μήνυμα επικοινωνίας: ${subject}`,
      html: `
        <p><strong>Όνομα:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Θέμα:</strong> ${subject}</p>
        <p><strong>Μήνυμα:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });
    $app.newMailClient().send(notifyMessage);

    const confirmationMessage = new MailerMessage({
      from: { address: senderAddress, name: "ReportAKI Support" },
      to: [{ address: email }],
      subject: "Λάβαμε το μήνυμά σας - ReportAKI",
      html: `
        <p>Γεια σας ${name},</p>
        <p>Λάβαμε το μήνυμά σας με θέμα "${subject}" και θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.</p>
        <p>Ευχαριστούμε,<br/>Η ομάδα ReportAKI</p>
      `,
    });
    $app.newMailClient().send(confirmationMessage);
  } catch (err) {
    $app.logger().error("Failed to send contact notification emails", "error", err);
  }
}, "contact_messages");
