import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }

    try {
        const data = await resend.emails.send({
            from: 'ReportAKI <onboarding@resend.dev>',
            to: ['reportaki.support@gmail.com'],
            reply_to: email,
            subject: `Νέο μήνυμα επικοινωνίας από: ${name || email}`,
            html: `
                <h3>Νέο μήνυμα από τη φόρμα ReportAKI</h3>
                <p><strong>Όνομα:</strong> ${name || '-'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Μήνυμα:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            `,
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;