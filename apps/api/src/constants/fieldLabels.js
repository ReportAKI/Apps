export const FIELD_LABELS = {
	FEK: 'ΦΕΚ',
	FEK_FILE_URL: 'Αρχείο ΦΕΚ',
	FEK_ARITH: 'Αριθμός ΦΕΚ',
	FEK_ETOS: 'Έτος ΦΕΚ',
	FEK_TEYXOS: 'Τεύχος ΦΕΚ',
	PUBL_DATE: 'Ημερομηνία δημοσίευσης',
	SIGN_DATE: 'Ημερομηνία υπογραφής',
	APOF_EIDOS: 'Είδος απόφασης',
	TITLE: 'Τίτλος',
	NUMBER_: 'Αριθμός',
	MAX_HEIGHT_M: 'Μέγιστο ύψος (μ.)',
	OROR_MAX_HEIGHT_COMMENT: 'Σχόλιο ύψους',
	NUM_OROFON: 'Αριθμός ορόφων',
	OROR_NUM_OROFON_COMMENT: 'Σχόλιο ορόφων',
	SYNTHIKI_TXT: 'Συνθήκη',
	SD_TIMH: 'Συντελεστής δόμησης',
	SD_TOMEAS: 'Τομέας',
	SD_KLIMAKOTOS: 'Κλιμακωτός συντελεστής',
	SD_COMMENT: 'Σχόλιο συντελεστή δόμησης',
	SYNTELESTIS_DOMISIS: 'Συντελεστής δόμησης',
	SYNTELESTHS_DOMHSHS: 'Συντελεστής δόμησης',
	KALYPSI: 'Συντελεστής κάλυψης',
	KALYPSH: 'Συντελεστής κάλυψης',
	POSOSTO_KALYPSIS: 'Ποσοστό κάλυψης',
	POSOSTO_KALYPSHS: 'Ποσοστό κάλυψης',
	COVERAGE: 'Συντελεστής κάλυψης',
	ELAX_EMBADO_M2: 'Ελάχιστο εμβαδόν (τ.μ.)',
	ELAX_EMBADO: 'Ελάχιστο εμβαδόν',
	EMBADO_M2: 'Εμβαδόν (τ.μ.)',
	EMBADO: 'Εμβαδόν',
	ELAX_PROSOP_M: 'Ελάχιστο πρόσωπο (μ.)',
	ELAX_PROSOPO: 'Ελάχιστο πρόσωπο',
	PROSOPO_M: 'Πρόσωπο (μ.)',
	PROSOPO: 'Πρόσωπο',
	ARTIOTITA: 'Αρτιότητα',
	EID_XRHSH_TXT: 'Είδος χρήσης',
	EID_XRHSH: 'Είδος χρήσης',
	GEN_XRHSH: 'Γενική χρήση',
	XRHSH_GHS: 'Χρήση γης',
	OT_NUM: 'Αριθμός οικοδομικού τετραγώνου',
	NAME: 'Ονομασία',
	KALL_DHM_NAME: 'Καλλικρατικός δήμος',
	NAME_GR: 'Ονομασία',
	CODE: 'Κωδικός',
	OTA: 'ΟΤΑ',
	NOMOS: 'Νομός',
	FOREAS: 'Φορέας',
	KATHGORDX: 'Κατηγορία (ΔΧ)',
	KATHGORAL1: 'Κατηγορία (ΑΛ1)',
	KATHGORAL2: 'Κατηγορία (ΑΛ2)',
	SITECODE: 'Κωδικός περιοχής',
	SITETYPE: 'Τύπος περιοχής',
	SITE_NAME_: 'Ονομασία περιοχής',
	GEOREF_DIAGRAM_URL: 'Γεωαναφερμένο διάγραμμα',
	INITIAL_DIAGRAM_URL: 'Αρχικό διάγραμμα',
	ZON_PROST_TYPE: 'Τύπος ζώνης προστασίας',
	PER_ZOE_TITLE: 'Τίτλος ΖΟΕ',
	OD: 'Οικοδομικό σύστημα',
	OROFOS: 'Όροφοι',
	YPSOS: 'Ύψος',
	YPSOS_M: 'Ύψος (μ.)',
	PROKIPIO: 'Προκήπιο',
	PROKIPIO_M: 'Προκήπιο (μ.)',
	RYMOTOMIKI: 'Ρυμοτομική γραμμή',
	OIKODOMIKI: 'Οικοδομική γραμμή',
	PERIGRAFI: 'Περιγραφή',
	PERIGRAFH: 'Περιγραφή',
	SXOLIO: 'Σχόλιο',
	COMMENT: 'Σχόλιο',
	PARATHRHSEIS: 'Παρατηρήσεις',
	AREA: 'Εμβαδόν',
	PERIMETER: 'Περίμετρος',
	DESCR: 'Περιγραφή',
	MAIN_USE: 'Κύρια χρήση',
	PERCENTAGE: 'Ποσοστό',
	LINK: 'Σύνδεσμος',
	KAEK: 'ΚΑΕΚ',
};

export function humanizeFieldName(rawName) {
	if (!rawName) return 'Στοιχείο';
	const key = String(rawName).trim();
	if (FIELD_LABELS[key]) return FIELD_LABELS[key];

	const upper = key.toUpperCase();
	if (FIELD_LABELS[upper]) return FIELD_LABELS[upper];

	for (const [code, label] of Object.entries(FIELD_LABELS)) {
		if (upper.endsWith(`_${code}`) || upper.endsWith(code)) {
			return label;
		}
	}

	let cleaned = key
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	const replacements = [
		[/NUM OROFON/gi, 'Αριθμός ορόφων'],
		[/ELAX EMBADO M2/gi, 'Ελάχιστο εμβαδόν (τ.μ.)'],
		[/ELAX EMBADO/gi, 'Ελάχιστο εμβαδόν'],
		[/ELAX PROSOP M/gi, 'Ελάχιστο πρόσωπο (μ.)'],
		[/ELAX PROSOP/gi, 'Ελάχιστο πρόσωπο'],
		[/EMBADO M2/gi, 'Εμβαδόν (τ.μ.)'],
		[/MAX HEIGHT M/gi, 'Μέγιστο ύψος (μ.)'],
		[/SD TIMH/gi, 'Συντελεστής δόμησης'],
		[/POSOSTO KALYPS/gi, 'Ποσοστό κάλυψης'],
		[/\bM2\b/gi, 'τ.μ.'],
		[/\bNUM\b/gi, 'Αριθμός'],
		[/\bELAX\b/gi, 'Ελάχιστο'],
		[/\bMAX\b/gi, 'Μέγιστο'],
		[/\bPROSOP\b/gi, 'πρόσωπο'],
		[/\bEMBADO\b/gi, 'εμβαδόν'],
		[/\bOROFON\b/gi, 'ορόφων'],
		[/\bHEIGHT\b/gi, 'ύψος'],
		[/\bKALYPS[IH]\b/gi, 'κάλυψης'],
	];

	for (const [pattern, repl] of replacements) {
		cleaned = cleaned.replace(pattern, repl);
	}

	if (/^[A-Z0-9\s().-]+$/.test(cleaned) && cleaned.length > 2) {
		cleaned = cleaned
			.toLowerCase()
			.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
	}

	return cleaned;
}

export function formatFieldValue(fieldName, value) {
	if (value === null || value === undefined) return '';
	let text = String(value).trim();
	if (!text) return '';

	const upper = String(fieldName || '').toUpperCase();
	const alreadyHasUnit = /τ\.?\s*μ\.|μ\.|%|όροφ/i.test(text);

	if (alreadyHasUnit) return text;

	if (/EMBADO|AREA|M2/.test(upper) && /^-?\d+([.,]\d+)?$/.test(text)) {
		return `${text.replace('.', ',')} τ.μ.`;
	}
	if (/PROSOP|HEIGHT|YPSOS|PROKIPIO|_M$/.test(upper) && /^-?\d+([.,]\d+)?$/.test(text) && !/OROF/.test(upper)) {
		return `${text.replace('.', ',')} μ.`;
	}
	if (/KALYPS|POSOSTO|PERCENT|PERCENTAGE/.test(upper) && /^-?\d+([.,]\d+)?$/.test(text)) {
		const n = parseFloat(text.replace(',', '.'));
		if (n > 0 && n <= 1) {
			return `${Math.round(n * 100)}%`;
		}
		return `${text.replace('.', ',')}%`;
	}
	if (/OROFON|OROFOS|NUM_OROF/.test(upper) && /^-?\d+([.,]\d+)?$/.test(text)) {
		const n = parseFloat(text.replace(',', '.'));
		if (n === 1) return '1 όροφος';
		return `${text.replace('.', ',')} όροφοι`;
	}
	if (/SD_TIMH|SYNTELEST|DOMIS|DOMHS/.test(upper) && /^-?\d+([.,]\d+)?$/.test(text)) {
		return text.replace('.', ',');
	}

	return text;
}
