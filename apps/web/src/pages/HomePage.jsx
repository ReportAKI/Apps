import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import PropertySearch from '@/components/PropertySearch.jsx';
import Footer from '@/components/Footer.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const HomePage = () => {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>ReportAKI</title>
        <meta
          name="description"
          content="Αναζητήστε και συλλέξτε πολεοδομικά και νομικά δεδομένα ακινήτων στην Ελλάδα με το ReportAKI"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-white text-black relative overflow-hidden">
        <main className="flex-1 flex flex-col items-center w-full justify-center">
          <section className="relative w-full px-4 pt-[15vh] pb-24">
            <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
              
              {/* Logo Wrapper με δυνατότητα κλικ */}
              <div className="relative flex items-center justify-center mb-6 w-full">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1] pointer-events-none select-none">
                  <span className="font-black text-black opacity-[0.06] text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] whitespace-nowrap tracking-tight">
                    ReportAKI
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setAboutOpen(true)}
                  className="cursor-pointer transition-all hover:opacity-90 active:scale-95 focus:outline-none"
                  title="Πατήστε για πληροφορίες σχετικά με το ReportAKI"
                  aria-label="Σχετικά με το ReportAKI"
                >
                  <img
                    src="/logo.png"
                    alt="ReportAKI Logo"
                    className="w-[300px] md:w-[350px] h-auto relative z-10 drop-shadow-xs"
                  />
                </button>
              </div>

              <p className="text-sm md:text-base text-black/70 font-medium max-w-full md:max-w-xl mx-auto mb-10 leading-relaxed">
                Εισάγετε τον κωδικό ΚΑΕΚ για να δείτε τα πολεοδομικά και νομικά δεδομένα του ακινήτου σας.
              </p>

              <div className="w-full">
                <PropertySearch />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Αναδυόμενο Παράθυρο Πληροφοριών */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 bg-white shadow-2xl border border-gray-100">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg md:text-xl font-bold text-gray-950">
              Σχετικά με το ReportAKI
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              Ψηφιακό εργαλείο πολεοδομικής και χωρικής πληροφόρησης ακινήτων
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-gray-700 leading-relaxed space-y-3.5 my-2">
            <p>
              Το <strong>ReportAKI</strong> είναι μια ψηφιακή πλατφόρμα που δημιουργήθηκε με σκοπό την απλοποίηση και την επιτάχυνση της αναζήτησης πολεοδομικών, γεωχωρικών και νομικών δεδομένων για ακίνητα στην Ελλάδα.
            </p>
            <p>
              Εισάγοντας απλώς τον <strong>Κωδικό Αριθμό Εθνικού Κτηματολογίου (ΚΑΕΚ)</strong>, η εφαρμογή συγκεντρώνει αυτόματα δεδομένα από επίσημες γεωπύλες (Εθνικό Κτηματολόγιο, SDIGMAP ΤΕΕ, ΓΠΣ) και συντάσσει ένα συγκεντρωτικό <strong>Τεχνικό Πόρισμα Ακινήτου</strong>.
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 text-xs text-gray-500">
              <strong>Σημείωση:</strong> Τα δεδομένα παρέχονται αποκλειστικά για σκοπούς αρχικής ενημέρωσης και δεν υποκαθιστούν τον επιτόπιο τεχνικό έλεγχο μηχανικού ή τις επίσημες βεβαιώσεις της αρμόδιας Υπηρεσίας Δόμησης.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomePage;