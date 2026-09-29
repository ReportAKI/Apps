import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }

    const userName = name && name.trim().length > 0 ? name.trim() : 'συνεργάτη';
    const emailSubject = subject && subject.trim().length > 0 ? subject.trim() : 'Γενικό ερώτημα';

    try {
        // 1. Email ειδοποίησης προς την ομάδα υποστήριξης του ReportAKI
        await resend.emails.send({
            from: 'ReportAKI <onboarding@resend.dev>',
            to: ['reportaki.support@gmail.com'],
            reply_to: email,
            subject: `[ReportAKI] Νέο μήνυμα επικοινωνίας: ${emailSubject}`,
            html: `
                <h3>Νέο μήνυμα από τη φόρμα επικοινωνίας</h3>
                <p><strong>Όνομα:</strong> ${name || '-'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Θέμα:</strong> ${emailSubject}</p>
                <p><strong>Μήνυμα:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            `,
        });

        // 2. Αυτόματο email επιβεβαίωσης προς τον χρήστη
        await resend.emails.send({
            from: 'ReportAKI Support <onboarding@resend.dev>',
            to: [email],
            subject: `Λάβαμε το μήνυμά σας: ${emailSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 8px;">
                    <h2 style="color: #000; margin-bottom: 16px;">Επιβεβαίωση παραλαβής μηνύματος</h2>
                    <p>Αγαπητή/έ <strong>${userName}</strong>,</p>
                    <p>Ευχαριστούμε που επικοινωνήσατε μαζί μας. Λάβαμε το μήνυμά σας με θέμα: <em>«${emailSubject}»</em>.</p>
                    <p>Η ομάδα του <strong>ReportAKI</strong> εξετάζει το αίτημά σας και θα επικοινωνήσει μαζί σας το συντομότερο δυνατό.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
                    
                    <p style="font-size: 13px; color: #666;">
                        Αυτό είναι ένα αυτοματοποιημένο μήνυμα επιβεβαίωσης. Μπορείτε να απαντήσετε απευθείας σε αυτό το μήνυμα εάν επιθυμείτε να προσθέσετε επιπλέον λεπτομέρειες.
                    </p>
                    <p style="margin-top: 24px; font-weight: 500;">
                        Με εκτίμηση,<br />
                        Η ομάδα του ReportAKI
                    </p>
                </div>
            `,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;