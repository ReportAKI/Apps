import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }

    const userName = name && name.trim().length > 0 ? name.trim() : '';
    const emailSubject = subject && subject.trim().length > 0 ? subject.trim() : 'Επικοινωνία';
    const greeting = userName ? `Γεια σας ${userName},` : 'Γεια σας,';

    try {
        // 1. Email ειδοποίησης προς την υποστήριξη
        await resend.emails.send({
            from: 'ReportAKI <onboarding@resend.dev>',
            to: ['reportaki.support@gmail.com'],
            reply_to: email,
            subject: `[ReportAKI] Νέο μήνυμα: ${emailSubject}`,
            html: `
                <h3>Νέο μήνυμα από τη φόρμα επικοινωνίας</h3>
                <p><strong>Όνομα:</strong> ${name || '-'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Θέμα:</strong> ${emailSubject}</p>
                <p><strong>Μήνυμα:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            `,
        });

        // 2. Αυτόματη απάντηση προς τον χρήστη
        await resend.emails.send({
            from: 'ReportAKI Support <onboarding@resend.dev>',
            to: [email],
            subject: `Λάβαμε το μήνυμά σας: ${emailSubject}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
                    <p>${greeting}</p>
                    <p>Λάβαμε το μήνυμά σας με θέμα "${emailSubject}" και θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.</p>
                    <p>Ευχαριστούμε,<br />Η ομάδα ReportAKI</p>
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