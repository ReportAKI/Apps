import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import pocketbaseClient from '@/lib/pocketbaseClient';

const initialForm = { name: '', email: '', subject: '', message: '' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactDialog = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const resetState = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitting(false);
    setSubmitted(false);
    setServerError('');
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) {
      resetState();
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Παρακαλώ συμπληρώστε το όνομά σας.';
    }
    if (!form.email.trim()) {
      next.email = 'Παρακαλώ συμπληρώστε το email σας.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = 'Το email δεν είναι έγκυρο.';
    }
    if (!form.subject.trim()) {
      next.subject = 'Παρακαλώ συμπληρώστε το θέμα.';
    }
    if (!form.message.trim()) {
      next.message = 'Παρακαλώ γράψτε το μήνυμά σας.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await pocketbaseClient.collection('contact_messages').create({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      setServerError(
        'Παρουσιάστηκε σφάλμα κατά την αποστολή του μηνύματος. Δοκιμάστε ξανά σε λίγο.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
          >
            <Mail className="h-4 w-4" strokeWidth={1.75} />
            Επικοινωνία
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-black">
            Επικοινωνία
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-black/80" strokeWidth={1.5} />
            <p className="text-sm text-black/80">
              Το μήνυμά σας εστάλη επιτυχώς. Θα επικοινωνήσουμε μαζί σας σύντομα.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Κλείσιμο
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Όνομα</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Το ονοματεπώνυμό σας"
                disabled={submitting}
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-subject">Θέμα</Label>
              <Input
                id="contact-subject"
                value={form.subject}
                onChange={handleChange('subject')}
                placeholder="Θέμα μηνύματος"
                disabled={submitting}
              />
              {errors.subject && (
                <p className="text-xs text-red-600">{errors.subject}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-message">Μήνυμα</Label>
              <Textarea
                id="contact-message"
                value={form.message}
                onChange={handleChange('message')}
                placeholder="Γράψτε το μήνυμά σας..."
                rows={4}
                disabled={submitting}
              />
              {errors.message && (
                <p className="text-xs text-red-600">{errors.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-xs text-red-600 text-center">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 bg-black text-white hover:bg-black/85"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Αποστολή...
                </span>
              ) : (
                'Αποστολή'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
