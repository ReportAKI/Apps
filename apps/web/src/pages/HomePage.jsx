import React from 'react';
import { Helmet } from 'react-helmet';
import PropertySearch from '@/components/PropertySearch.jsx';
import Footer from '@/components/Footer.jsx';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>ReportAKI</title>
        <meta name="description" content="Αναζητήστε και συλλέξτε πολεοδομικά δεδομένα ακινήτων στην Ελλάδα με το ReportAKI" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-white text-black relative overflow-hidden">
        <main className="flex-1 flex flex-col items-center w-full justify-center">
          <section className="relative w-full px-4 pt-[15vh] pb-24">
            <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
              <div className="relative flex items-center justify-center mb-6 w-full">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1] pointer-events-none select-none">
                  <span className="font-black text-black opacity-[0.06] text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] whitespace-nowrap tracking-tight">
                    ReportAKI
                  </span>
                </div>
                <img
                  src="/logo.png"
                  className="w-[300px] md:w-[350px] h-auto relative z-10"
                />
              </div>

              <p className="text-sm md:text-base text-black/70 font-medium max-w-full md:max-w-xl mx-auto mb-10 leading-relaxed">
                Εισάγετε τον κωδικό ΚΑΕΚ για να δείτε τα πολεοδομικά και νομικά δεδομένα.
              </p>

              <div className="w-full">
                <PropertySearch />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
