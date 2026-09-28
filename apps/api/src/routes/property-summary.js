import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { humanizeFieldName, formatFieldValue } from '../constants/fieldLabels.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';

const router = Router();

const systemPrompt = `
Είσαι κορυφαίος Διπλωματούχος Τοπογράφος Μηχανικός και Εμπειρογνώμονας Πολεοδόμος.
Σου παρέχονται επίσημα κτηματολογικά και πολεοδομικά δεδομένα ακινήτου.
Αποστολή σου είναι η σύνταξη μιας επίσημης, τεχνικά εμπεριστατωμένης και απόλυτα επαγγελματικής Τεχνικής Έκθεσης - Πορίσματος.

ΤΟ ΚΕΙΜΕΝΟ ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ ΣΥΝΕΧΗΣ ΡΕΩΝ ΛΟΓΟΣ ΧΩΡΙΣ ΑΡΙΘΜΗΜΕΝΟΥΣ ΤΙΤΛΟΥΣ, ΧΩΡΙΣ HEADINGS ΚΑΙ ΧΩΡΙΣ BULLET POINTS.
Σύνταξε ΑΚΡΙΒΩΣ 7 συνεκτικές, τεχνικές παραγράφους (3 έως 5 προτάσεις η καθεμία), ενσωματώνοντας οργανικά τα πλήρη στοιχεία των ΦΕΚ:

1η Παράγραφος (Ταυτότητα, Χωρική Υπαγωγή & Κτηματολόγιο):
Αναφορά στον ΚΑΕΚ, πλήρη διεύθυνση, Δήμο, Περιφερειακή Ενότητα, συντεταγμένες κεντροειδούς, εμβαδόν (τ.μ.), περίμετρο (μ.) και Οικοδομικό Τετράγωνο. Καταγραφή του επίσημου χαρακτηρισμού χρήσης κατά το Εθνικό Κτηματολόγιο και του καταγεγραμμένου ποσοστού δικαιώματος κυριότητας.

2η Παράγραφος (Χωρικό Καθεστώς, Χρήσεις Γης & Τίτλοι ΦΕΚ):
Ενσωμάτωση του ΦΕΚ του Γενικού Πολεοδομικού Σχεδίου (ΓΠΣ) ΜΑΖΙ ΜΕ ΤΟΝ ΠΛΗΡΗ ΤΙΤΛΟ/ΘΕΜΑ ΤΗΣ ΑΠΟΦΑΣΗΣ (π.χ. «ΦΕΚ ... με τίτλο ...»). Προσδιορισμός της θεσμοθετημένης ζώνης χρήσης (π.χ. Γενική Κατοικία) και τεχνική ανάλυση των επιτρεπόμενων λειτουργιών σύμφωνα με το σχετικό κανονιστικό διάταγμα χρήσεων γης.

3η Παράγραφος (Πολεοδομικά Μεγέθη, Συντελεστές & Αριθμητική Ανάλυση):
Αναφορά στον εγκεκριμένο Συντελεστή Δόμησης (Σ.Δ.), το ποσοστό κάλυψης και το επιτρεπόμενο ύψος/ορόφους. Αναλυτικός αριθμητικός υπολογισμός της μέγιστης επιτρεπόμενης δόμησης (Εμβαδόν × Σ.Δ.) και της μέγιστης κάλυψης (Εμβαδόν × % κάλυψης) σε τετραγωνικά μέτρα, αποσαφηνίζοντας ότι τα μεγέθη αυτά αποτελούν το ανώτατο θεωρητικό κανονιστικό πλαίσιο της περιοχής.

4η Παράγραφος (Κανόνες Αρτιότητας & Πρόσωπο επί Οδού):
Αναλυτική αναφορά στα όρια αρτιότητας κατά κανόνα και κατά παρέκκλιση (εμβαδόν και πρόσωπο). Σύγκριση της επιφάνειας του γεωτεμαχίου με τα όρια αυτά και επισήμανση ότι η γεωμετρική αρτιότητα αποτελεί αναγκαία αλλά όχι ικανή συνθήκη οικοδομησιμότητας, η οποία εξαρτάται άμεσα από τη νομιμότητα του προσώπου και το ρυμοτομικό καθεστώς.

5η Παράγραφος (Ρυμοτομικό Σχέδιο, Γραμμές & Τίτλοι Ρυμοτομικών ΦΕΚ):
Αναφορά στα εγκεκριμένα ρυμοτομικά σχέδια και τροποποιήσεις με τα αντίστοιχα ΦΕΚ ΚΑΙ ΤΟΥΣ ΠΛΗΡΕΙΣ ΤΙΤΛΟΥΣ ΤΩΝ ΑΠΟΦΑΣΕΩΝ. Επισήμανση της θέσης των ρυμοτομικών και οικοδομικών γραμμών, καθώς και τυχόν εκκρεμοτήτων ρυμοτομικής απαλλοτρίωσης ή υποχρεώσεων εισφοράς σε γη/χρήμα.

6η Παράγραφος (Ειδικές Δεσμεύσεις, Δίκτυα & Περιβαλλοντικές Προστασίες):
Έλεγχος και ρητή τεχνική διαβεβαίωση περί ύπαρξης ή απουσίας ειδικών βαρών: ρέματα, προστατευόμενες περιοχές Natura 2000, δασικές εκτάσεις, γραμμές αιγιαλού/παραλίας, αρχαιολογικοί χώροι ή δεσμεύσεις για κοινωφελείς σκοπούς.

7η Παράγραφος (Τεχνική Συμβουλή Μηχανικού & Δυνατότητες Αξιοποίησης):
Συνδυασμός των διατάξεων των προαναφερθέντων ΦΕΚ και παροχή σαφούς συμβουλευτικής καθοδήγησης προς τον ενδιαφερόμενο: τι συγκεκριμένα επιτρέπεται να υλοποιήσει (π.χ. νέα ανέγερση, προσθήκη, εκσυγχρονισμός, επαγγελματική χρήση) και ποιο είναι το κρίσιμο τεχνικό επόμενο βήμα (π.χ. εξαρτημένο τοπογραφικό διάγραμμα, έλεγχος διάνοιξης και διαμόρφωσης της οδού, κύρωση πράξης αναλογισμού) ώστε να αποφευχθούν νομικές εμπλοκές ή καθυστερήσεις κατά την αδειοδότηση.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ & ΑΠΑΓΟΡΕΥΣΕΙΣ:
- ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ οποιοδήποτε disclaimer (ΜΗΝ ΓΡΑΦΕΙΣ: «Το παρόν πόρισμα συντάχθηκε...», «δεν υποκαθιστά επίσημο έλεγχο/ΥΔΟΜ», «βασίζεται στην πλατφόρμα SDIGMAP»).
- ΑΠΑΓΟΡΕΥΟΝΤΑΙ ΤΙΤΛΟΙ, HEADINGS ΚΑΙ BULLETS (Μην γράφεις ##, ###, *, -).
- ΑΠΑΓΟΡΕΥΟΝΤΑΙ ΤΑ URLs (Μην γράφεις https, http ή .pdf).
- Μην τοποθετείς υπογραφές ή ημερομηνίες στο τέλος.
- ΥΠΟΧΡΕΩΤΙΚΗ ΟΛΟΚΛΗΡΩΣΗ: Πρέπει να παραχθούν και οι 7 παράγραφοι πλήρεις, χωρίς διακοπή προτάσεων.
`;

function buildCompletePropertyPrompt({ kaek, geoData, area, perimeter, coords, sdigmap, property }) {
  const lines = [];

  lines.push('=== ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ ΓΕΩΤΕΜΑΧΙΟΥ ===');
  lines.push(`ΚΑΕΚ: ${kaek}`);
  if (typeof area === 'number' || area) lines.push(`Εμβαδόν πολυγώνου: ${Number(area).toFixed(2)} τ.μ.`);
  if (typeof perimeter === 'number' || perimeter) lines.push(`Περίμετρος πολυγώνου: ${Number(perimeter).toFixed(2)} μ.`);
  
  if (coords) {
    const coordsStr = typeof coords === 'string' ? coords : `${coords.latitude}, ${coords.longitude}`;
    lines.push(`Συντεταγμένες κεντροειδούς: ${coordsStr}`);
  }

  lines.push('\n=== ΣΤΟΙΧΕΙΑ ΓΕΩΚΩΔΙΚΟΠΟΙΗΣΗΣ & ΤΟΠΟΘΕΣΙΑΣ ===');
  if (geoData?.fullAddress) lines.push(`Πλήρης Διεύθυνση: ${geoData.fullAddress}`);
  if (geoData?.road) lines.push(`Οδός & Αριθμός: ${geoData.road} ${geoData.houseNumber || ''}`);
  if (geoData?.city || geoData?.municipality) lines.push(`Δήμος / Πόλη: ${geoData.municipality || geoData.city}`);
  if (geoData?.county) lines.push(`Περιφερειακή Ενότητα: ${geoData.county}`);
  if (geoData?.postalCode) lines.push(`Ταχυδρομικός Κώδικας: ${geoData.postalCode}`);

  lines.push('\n=== ΣΤΟΙΧΕΙΑ ΕΘΝΙΚΟΥ ΚΤΗΜΑΤΟΛΟΓΙΟΥ (ARCGIS) ===');
  if (property?.description) lines.push(`Περιγραφή ακινήτου: ${property.description}`);
  if (property?.urbanPlanning?.mainUse) lines.push(`Κύρια χρήση Κτηματολογίου: ${property.urbanPlanning.mainUse}`);
  if (property?.urbanPlanning?.percentage != null) lines.push(`Ποσοστό δικαιώματος: ${property.urbanPlanning.percentage}%`);

  lines.push('\n=== ΑΝΑΛΥΤΙΚΑ ΔΕΔΟΜΕΝΑ ΠΟΛΕΟΔΟΜΙΑΣ (SDIGMAP) ===');
  if (sdigmap?.categories && Array.isArray(sdigmap.categories)) {
    for (const category of sdigmap.categories) {
      lines.push(`\n[Κατηγορία: ${category.label || category.key}]`);
      for (const layer of category.layers || []) {
        lines.push(`  * Επίπεδο: ${layer.label}`);
        for (const record of layer.records || []) {
          for (const field of record || []) {
            if (field?.value !== undefined && field?.value !== null && field?.value !== '') {
              const strVal = String(field.value).trim();
              
              if (strVal.startsWith('http') || strVal.includes('.pdf') || field.field?.includes('URL')) {
                continue;
              }

              const label = humanizeFieldName(field.field) || field.field;
              const formattedVal = formatFieldValue(field.field, field.value);
              lines.push(`    - ${label}: ${formattedVal}`);
            }
          }
        }
      }
    }
  }

  lines.push('\nΠαρακαλώ συνέταξε το πλήρες τεχνικό πόρισμα αναλύοντας όλα τα ανωτέρω δεδομένα, ενσωματώνοντας τους τίτλους των ΦΕΚ και διατηρώντας αυστηρά επαγγελματικό ύφος μηχανικού, σε 7 πλήρεις παραγράφους χωρίς τίτλους, χωρίς disclaimers και χωρίς URLs.');
  return lines.join('\n');
}

// Δυναμική επιλογή διαθέσιμου μοντέλου από το ίδιο το Google API
async function resolveActiveModel(ai) {
  try {
    const listRes = await ai.models.list();
    const available = [];
    for await (const m of listRes) {
      const name = (m.name || '').replace(/^models\//, '');
      if (name.includes('gemini')) {
        available.push(name);
      }
    }

    // Προτεραιότητες μοντέλων
    const priority = ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-2.5-pro', 'gemini-flash'];
    for (const p of priority) {
      const match = available.find(m => m === p || m.includes(p));
      if (match) return match;
    }

    if (available.length > 0) return available[0];
  } catch (err) {
    console.warn('[AI Report] Σφάλμα ανάκτησης δυναμικής λίστας μοντέλων:', err?.message || err);
  }

  // Ασφαλής προεπιλογή
  return 'gemini-3.6-flash';
}

async function callGemini({ systemPrompt, userMessage }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Το GEMINI_API_KEY δεν βρέθηκε στο .env');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = await resolveActiveModel(ai);

  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[AI Report] Κλήση μοντέλου ${modelName} (Προσπάθεια ${attempt}/2)...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        }
      });

      const candidate = response?.candidates?.[0];
      const outputText = candidate?.content?.parts?.[0]?.text;
      if (!outputText) {
        throw new Error('Το Gemini επέστρεψε κενό κείμενο.');
      }

      console.log(`[AI Report] Επιτυχής παραγωγή πορίσματος με ${modelName} (${outputText.length} χαρακτήρες).`);
      return outputText.trim();

    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[AI Report Error στο ${modelName}]:`, errMsg);

      const isRateLimit = err?.status === 429 || errMsg.includes('429') || errMsg.includes('quota');
      const isUnavailable = err?.status === 503 || errMsg.includes('503');

      if ((isRateLimit || isUnavailable) && attempt < 2) {
        console.warn(`[AI Report] Αναμονή 2 δευτερολέπτων πριν από επανάληψη...`);
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error('Η κλήση στο Gemini απέτυχε.');
}

router.post('/', integratedAiRateLimit, async (req, res) => {
  const { kaek, geoData, area, perimeter, coords, sdigmap, property } = req.body || {};

  if (!kaek) {
    return res.status(422).json({ error: 'Απαιτείται ο κωδικός ΚΑΕΚ' });
  }

  try {
    const fullPrompt = buildCompletePropertyPrompt({
      kaek,
      geoData,
      area,
      perimeter,
      coords,
      sdigmap,
      property
    });

    console.log(`[AI Report] Σύνταξη νέου πορίσματος από το Gemini για ΚΑΕΚ ${kaek}...`);

    const summary = await callGemini({
      systemPrompt,
      userMessage: fullPrompt
    });

    console.log(`[AI Report] Επιτυχής σύνταξη πορίσματος για ΚΑΕΚ ${kaek}!`);
    return res.json({ summary });

  } catch (err) {
    console.error('[AI Report Error]:', err.message || err);
    return res.status(500).json({ error: err.message || 'Αποτυχία παραγωγής πορίσματος από το AI.' });
  }
});

export default router;