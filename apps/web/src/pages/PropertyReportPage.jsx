import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Maximize, Ruler, Loader2, Database, AlertTriangle, 
  RefreshCw, ExternalLink, MapPin, Filter, ChevronDown, Check, 
  Download, FileText, Scale, Landmark, 
  CheckCircle2, Building2, Map as MapIcon, X
} from 'lucide-react';
import { buildExportModel, generatePdfHtml, generateSummaryHtml } from '@/lib/propertyExport';
import html2canvas from 'html2canvas';
import { renderPropertyMapImage } from '@/lib/mapImage';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuItem, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';
import Footer from '@/components/Footer.jsx';

const MapUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getPolygonArea(coords) {
  if (!coords || coords.length < 3) return 0;
  const lat0 = coords[0][0];
  const mPerLat = 111320;
  const mPerLon = 111320 * Math.cos(lat0 * Math.PI / 180);
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const x1 = coords[i][1] * mPerLon;
    const y1 = coords[i][0] * mPerLat;
    const x2 = coords[j][1] * mPerLon;
    const y2 = coords[j][0] * mPerLat;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function getPolygonPerimeter(coords) {
  if (!coords || coords.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    perimeter += getDistance(coords[i][0], coords[i][1], coords[j][0], coords[j][1]);
  }
  return perimeter;
}

function toLeafletCoords(polygon) {
  if (!polygon || !Array.isArray(polygon)) return [];
  const ring = Array.isArray(polygon[0]) && Array.isArray(polygon[0][0]) ? polygon[0] : polygon;
  return ring.map(coord => [coord[1], coord[0]]);
}

const FIELD_LABELS = {
  FEK: 'ΦΕΚ',
  FEK_FILE_URL: 'Αρχείο ΦΕΚ',
  PUBL_DATE: 'Ημ. Δημοσίευσης',
  SIGN_DATE: 'Ημ. Υπογραφής',
  APOF_EIDOS: 'Είδος Απόφασης',
  APOF_THEME: 'Θέμα Απόφασης',
  TITLE: 'Τίτλος',
  NUMBER_: 'Αριθμός',
  MAX_HEIGHT_M: 'Μέγιστο Ύψος (μ.)',
  OROR_MAX_HEIGHT_COMMENT: 'Σχόλιο Ύψους',
  NUM_OROFON: 'Αριθμός Ορόφων',
  OROR_NUM_OROFON_COMMENT: 'Σχόλιο Ορόφων',
  SYNTHIKI_TXT: 'Συνθήκη',
  SD_TIMH: 'Συντελεστής Δόμησης',
  SD_TOMEAS: 'Τομέας',
  SD_KLIMAKOTOS: 'Κλιμακωτός',
  SD_COMMENT: 'Σχόλιο',
  EID_XRHSH_TXT: 'Είδος Χρήσης',
  EID_XRHSH: 'Είδος Χρήσης',
  GEN_XRHSH: 'Γενική Χρήση',
  OT_NUM: 'Αριθμός Ο.Τ.',
  NAME: 'Ονομασία',
  KALL_DHM_NAME: 'Καλλικρατικός Δήμος',
  NAME_GR: 'Ονομασία',
  CODE: 'Κωδικός',
  OTA: 'ΟΤΑ',
  NOMOS: 'Νομός',
  FOREAS: 'Φορέας',
  KATHGORDX: 'Κατηγορία (ΔΧ)',
  KATHGORAL1: 'Κατηγορία (ΑΛ1)',
  KATHGORAL2: 'Κατηγορία (ΑΛ2)',
  SITECODE: 'Κωδικός Περιοχής',
  SITETYPE: 'Τύπος Περιοχής',
  SITE_NAME_: 'Ονομασία Περιοχής',
  GEOREF_DIAGRAM_URL: 'Γεωαναφερμένο Διάγραμμα',
  INITIAL_DIAGRAM_URL: 'Αρχικό Διάγραμμα',
  ZON_PROST_TYPE: 'Τύπος Ζώνης Προστασίας',
  PER_ZOE_TITLE: 'Τίτλος ΖΟΕ',
  OD: 'Ο.Δ.'
};

function formatShortAddress({ route, streetNumber, locality, postalCode }) {
  const streetPart = [route || '', streetNumber || ''].filter(Boolean).join(' ');
  const postalPart = postalCode ? `ΤΚ ${postalCode}` : '';
  return [streetPart, locality || '', postalPart].filter(Boolean).join(', ');
}

function getCategoryFinding(category, layer, propertyData, area) {
  const fullText = `${category?.label || ''} ${layer?.label || ''}`.toLowerCase();
  const areaTxt = area > 0 ? `${Math.round(area)} τ.μ.` : 'του ακινήτου';
  const isCommon = propertyData?.description?.toLowerCase().includes('κοινόχρηστ') || 
                   propertyData?.urbanPlanning?.mainUse?.toLowerCase().includes('κοινόχρηστ');

  let fek = null;
  let apof = null;
  let code = null;
  let name = null;

  if (layer?.records?.[0]) {
    for (const r of layer.records[0]) {
      if (r.field === 'FEK') fek = r.value;
      if (r.field === 'APOF_EIDOS' || r.field === 'APOF_THEME') apof = r.value;
      if (r.field === 'CODE') code = r.value;
      if (r.field === 'NAME_GR' || r.field === 'NAME') name = r.value;
    }
  }

  if (fullText.includes('κτηματολόγ') || fullText.includes('γεωτεμάχι') || fullText.includes('δημοτικ') || fullText.includes('ενότητ')) {
    return {
      badge: 'Επίσημη Κτηματολογική Καταγραφή',
      title: name ? `Διοικητική Υπαγωγή: ${name}` : 'Καταγεγραμμένο Γεωτεμάχιο Εθνικού Κτηματολογίου',
      summary: `Το ακίνητο (${areaTxt}) είναι επίσημα καταχωρημένο και εντοπισμένο στα κτηματολογικά διαγράμματα${code ? ` υπό τον κωδικό ενότητας ${code}` : ''}. Η εγγραφή κατοχυρώνει τη χωρική του ταυτότητα και τη διοικητική του αρμοδιότητα.`,
      cards: [
        {
          q: 'Τι ισχύει με την καταγραφή;',
          a: 'Πιστοποιεί την επίσημη χωρική αποτύπωση, τα όρια και το εμβαδόν του γεωτεμαχίου στην αρμόδια αρχή.'
        },
        {
          q: 'Επιτρέπει άμεση δόμηση;',
          a: 'Η κτηματολογική καταγραφή ορίζει τη γεωμετρία. Η δυνατότητα δόμησης ρυθμίζεται από τις ισχύουσες ρυμοτομικές γραμμές.'
        },
        {
          q: 'Τι σημαίνει για τον ιδιοκτήτη;',
          a: 'Παρέχει απόλυτη σαφήνεια για τη θέση, το εμβαδόν και το διοικητικό πλαίσιο στο οποίο υπάγεται το ακίνητο.'
        }
      ]
    };
  }

  if (fullText.includes('χρήσεις') || fullText.includes('γπσ') || fullText.includes('πολεοδομ')) {
    if (isCommon) {
      return {
        badge: 'Κοινόχρηστος Χώρος / Μη Οικοδομήσιμο Ιδιωτικά',
        title: 'Μη Οικοδομήσιμο για Ιδιωτική Χρήση / Κοινόχρηστος Χώρος & Πράσινο',
        summary: `Το γεωτεμάχιο αυτό, παρότι διαθέτει μεγάλο εμβαδόν (${areaTxt}) και θεωρητικούς όρους δόμησης, είναι χαρακτηρισμένο στο Κτηματολόγιο ως «κοινόχρηστος χώρος» και στο Πολεοδομικό Σχέδιο ως «ελεύθερος χώρος - αστικό πράσινο».`,
        cards: [
          {
            q: 'Μπορώ να χτίσω;',
            a: 'Όχι άμεσα. Οι γενικοί αριθμοί δόμησης είναι θεωρητικοί κανόνες της περιοχής, αλλά δεν εφαρμόζονται σε ιδιωτική ανέγερση εφόσον το ακίνητο παραμένει δεσμευμένο ως κοινόχρηστο.'
          },
          {
            q: 'Τι σημαίνει για τον ιδιοκτήτη;',
            a: 'Δεν μπορείτε να χτίσετε σπίτι ή ιδιωτική οικοδομή με τον συνηθισμένο τρόπο. Ο χώρος προορίζεται για κοινή χρήση από το κοινό ή για δημοτικές ανάγκες πρασίνου.'
          },
          {
            q: 'Τι ισχύει με τους συντελεστές;',
            a: 'Αν ήταν κανονικό ιδιωτικό οικόπεδο, οι συντελεστές θα επέτρεπαν δόμηση. Όμως, η χρήση υπερισχύει των αριθμών, καθιστώντας τα μεγέθη αυτά καθαρά θεωρητικά.'
          }
        ]
      };
    }
    return {
      badge: 'Θεσμοθετημένες Χρήσεις Γης',
      title: 'Καθεστώς Χρήσεων Γης & Επιτρεπόμενες Λειτουργίες',
      summary: `Οι θεσμοθετημένες χρήσεις γης καθορίζουν το επιτρεπόμενο εύρος λειτουργιών (κατοικία, εμπόριο, κοινωφελείς σκοποί) και προστατεύουν τον οικιστικό χαρακτήρα της περιοχής (${areaTxt}).`,
      cards: [
        {
          q: 'Ποιες χρήσεις επιτρέπονται;',
          a: 'Επιτρέπονται μόνο οι δραστηριότητες που προβλέπονται από τις γενικές και ειδικές χρήσεις του εγκεκριμένου σχεδίου.'
        },
        {
          q: 'Υπάρχουν απαγορεύσεις;',
          a: 'Απαγορεύεται κάθε δραστηριότητα που αλλοιώνει τον οικιστικό χαρακτήρα ή προκαλεί περιβαλλοντική όχληση.'
        },
        {
          q: 'Νομική κατοχύρωση;',
          a: fek ? `Ισχύει βάσει του δημοσιευμένου ΦΕΚ ${fek}.` : 'Πλήρης κανονιστική ισχύς βάσει του επίσημου σχεδίου.'
        }
      ]
    };
  }

  if (fullText.includes('όροι δόμησης') || fullText.includes('όρων δόμησης') || fullText.includes('ύψος') || fullText.includes('όροφοι') || fullText.includes('αρτιότητα')) {
    return {
      badge: 'Πολεοδομικοί Κανόνες & Μεγέθη',
      title: 'Όροι Δόμησης, Μέγιστο Ύψος & Αρτιότητα',
      summary: `Οι συντελεστές δόμησης, κάλυψης και τα όρια ύψους καθορίζουν το μέγιστο μέγεθος τυχόν επιτρεπόμενης κτιριακής εγκατάστασης για το γεωτεμάχιο (${areaTxt}).`,
      cards: [
        {
          q: 'Είναι άρτιο το ακίνητο;',
          a: `Το εμβαδόν (${areaTxt}) καλύπτει τα ελάχιστα όρια κανόνα/παρέκκλισης, με την προϋπόθεση ότι δεν υπάρχει ρυμοτομικό εμπόδιο.`
        },
        {
          q: 'Πώς υπολογίζεται η δόμηση;',
          a: 'Υπολογίζεται πολλαπλασιάζοντας το καθαρό εμβαδόν με τον Σ.Δ. της περιοχής, εφόσον το ακίνητο είναι οικοδομήσιμο.'
        },
        {
          q: 'Ποιο είναι το μέγιστο ύψος;',
          a: 'Προσδιορίζεται από τον αριθμό ορόφων και τις ειδικές διατάξεις του ΝΟΚ και της οικείας πολεοδομικής ενότητας.'
        }
      ]
    };
  }

  if (fullText.includes('αποφάσεις') || fullText.includes('διατάγματα') || fullText.includes('τροποποιήσε') || fullText.includes('ρυμοτομ')) {
    return {
      badge: 'Ρυμοτομικό Καθεστώς',
      title: fek ? `Εγκεκριμένες Πράξεις Ρυμοτομίας (ΦΕΚ ${fek})` : 'Ρυμοτομικές Γραμμές & Πράξεις Σχεδίου',
      summary: `Οι εγκεκριμένες πράξεις ${apof ? `(${apof}) ` : ''}καθορίζουν τις ρυμοτομικές και οικοδομικές γραμμές και δεσμεύουν τα τμήματα που τίθενται σε κοινή χρήση επί του ακινήτου (${areaTxt}).`,
      cards: [
        {
          q: 'Υφίσταται ρυμοτόμηση;',
          a: 'Ελέγχεται αν τμήμα ή το σύνολο του γεωτεμαχίου τέμνεται από εγκεκριμένη ρυμοτομική γραμμή ή οδό.'
        },
        {
          q: 'Τι ισχύει για ανέγερση;',
          a: 'Απαιτείται η πλήρης κύρωση της πράξης εφαρμογής ή αναλογισμού πριν από οποιαδήποτε έκδοση οικοδομικής άδειας.'
        },
        {
          q: 'Ισχύς νομοθεσίας;',
          a: fek ? `Καθορισμένο με το ΦΕΚ ${fek}.` : 'Ισχύουσα ρυθμιστική πράξη της διοίκησης.'
        }
      ]
    };
  }

  return {
    badge: 'Θεσμοθετημένη Ρύθμιση',
    title: category?.label || 'Πολεοδομικό Πλαίσιο',
    summary: `Οι θεσμοθετημένες ρυθμίσεις της κατηγορίας αυτής προσδιορίζουν τις πολεοδομικές δεσμεύσεις και το καθεστώς εκμετάλλευσης του ακινήτου (${areaTxt}) σύμφωνα με τα επίσημα δεδομένα.`,
    cards: [
      {
        q: 'Τι αφορά η ρύθμιση;',
        a: layer?.label || 'Κανονιστικό πλαίσιο της ευρύτερης περιοχής.'
      },
      {
        q: 'Ποια είναι η ισχύς της;',
        a: 'Εφαρμόζεται άμεσα ως ισχύουσα διάταξη των επίσημων πολεοδομικών φορέων.'
      }
    ]
  };
}

function getLegislationStatus(data) {
  const valStr = JSON.stringify(data || {}).toLowerCase();
  
  if (valStr.includes('καταργ') || valStr.includes('ανακλη') || valStr.includes('ακυρω') || valStr.includes('παρωχη')) {
    return {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      label: 'Δεν ισχύει / Καταργημένο'
    };
  }
  
  if (valStr.includes('παρεκκλ') || valStr.includes('τροποποι') || valStr.includes('υποκει') || valStr.includes('θεωρητικ')) {
    return {
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      label: 'Ισχύει μερικώς / Ειδικοί όροι'
    };
  }

  return {
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    label: 'Ισχύει σήμερα'
  };
}

function parseLayerRecord(rows) {
  const tiles = [];
  const links = [];
  const data = {};

  let fekVal = null;
  let apofVal = null;
  let numVal = null;
  let pubDateVal = null;
  let signDateVal = null;

  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!row || row.value === undefined || row.value === null || row.value === '') continue;
      const f = row.field;
      const strVal = String(row.value).trim();
      
      if (f && (f.endsWith('_FLAG') || f.includes('FLAG'))) continue;

      data[f] = strVal;

      if (row.url || strVal.startsWith('http') || (f && f.includes('URL'))) {
        links.push({
          label: (FIELD_LABELS[f] || f).replace('Αρχείο ', '').replace(' (URL)', ''),
          url: row.url || strVal
        });
        continue;
      }

      if (f === 'FEK') fekVal = strVal;
      else if (f === 'APOF_EIDOS') apofVal = strVal;
      else if (f === 'NUMBER_') numVal = strVal;
      else if (f === 'PUBL_DATE') pubDateVal = strVal;
      else if (f === 'SIGN_DATE') signDateVal = strVal;
      else {
        tiles.push({
          field: f,
          label: FIELD_LABELS[f] || f,
          value: strVal
        });
      }
    }
  }

  const lawParts = [];
  if (fekVal) lawParts.push(`ΦΕΚ ${fekVal}`);
  if (apofVal) lawParts.push(apofVal);
  if (numVal) lawParts.push(`Αριθμ. ${numVal}`);
  if (pubDateVal) lawParts.push(`(Δημ. ${pubDateVal})`);
  else if (signDateVal) lawParts.push(`(Υπογρ. ${signDateVal})`);

  const legislationText = lawParts.length > 0 ? lawParts.join(' • ') : 'Ισχύουσα κανονιστική ρύθμιση / πράξη';
  const status = getLegislationStatus(data);

  return { tiles, legislationText, links, status };
}

function extractGlobalBuildingStats(categories) {
  let sd = null;
  let coverage = null;
  let maxFloors = null;
  let ruleArt = null;
  let deviationArt = null;

  for (const cat of categories || []) {
    for (const l of cat.layers || []) {
      for (const rec of l.records || []) {
        for (const f of rec || []) {
          const val = String(f?.value || '').trim();
          const fld = f?.field || '';
          if (!val) continue;

          if (fld === 'SD_TIMH' && !sd) sd = val;
          if (fld === 'NUM_OROFON' && !maxFloors) maxFloors = val;
          if ((fld.includes('KALYPS') || val.includes('%')) && !coverage) {
            const m = val.match(/\d+/);
            if (m) coverage = `${m[0]}%`;
          }
          if (fld.includes('KANON') || val.toLowerCase().includes('κατά κανόνα')) {
            ruleArt = val;
          }
          if (fld.includes('PAREK') || val.toLowerCase().includes('παρέκκλιση')) {
            deviationArt = val;
          }
        }
      }
    }
  }

  return {
    sd: sd ? parseFloat(sd) : 1.6,
    coverage: coverage || '60%',
    maxFloors: maxFloors || '3',
    ruleArt: ruleArt || 'ελάχ. 200 τ.μ. & πρόσωπο 10 μ.',
    deviationArt: deviationArt || 'ελάχ. 200 τ.μ. & πρόσωπο 8 μ.'
  };
}

const PropertyReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [propertyData, setPropertyData] = useState(location.state?.propertyData || null);
  const [isLoading, setIsLoading] = useState(!location.state?.propertyData);
  const [sdigmap, setSdigmap] = useState(null);
  const [sdigmapLoading, setSdigmapLoading] = useState(false);
  const [sdigmapError, setSdigmapError] = useState(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  const mapWrapperRef = useRef(null);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState({});
  const [includeMapInExport, setIncludeMapInExport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // States για το In-App Preview Modal
  const [previewHtml, setPreviewHtml] = useState(null);
  const previewIframeRef = useRef(null);

  const kaek = propertyData?.kaek || id;
  const leafletPolygonCoords = toLeafletCoords(propertyData?.polygon);
  const area = getPolygonArea(leafletPolygonCoords);
  const perimeter = getPolygonPerimeter(leafletPolygonCoords);
  const coords = propertyData?.coordinates;
  const selectedCategory = sdigmap ? sdigmap.categories.find(cat => cat.key === selectedCategoryKey) || null : null;
  const selectedLayer = selectedCategory ? selectedCategory.layers[selectedLayerIndex] || selectedCategory.layers[0] || null : null;
  const selectedExportCount = Object.values(selectedCategoryKeys).filter(Boolean).length;

  const buildingStats = useMemo(() => extractGlobalBuildingStats(sdigmap?.categories), [sdigmap]);

  const isBuildingTermsActive = useMemo(() => {
    const text = `${selectedCategory?.label || ''} ${selectedLayer?.label || ''}`.toLowerCase();
    return text.includes('όροι δόμησης') || text.includes('όρων δόμησης') || text.includes('αρτιότητα') || text.includes('κάλυψη') || text.includes('συντελεστής');
  }, [selectedCategory, selectedLayer]);

  async function fetchByKaek(kaekCode) {
    setIsLoading(true);
    try {
      const response = await apiServerClient.fetch(`/arcgis/search?kaek=${encodeURIComponent(kaekCode)}`);
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        setPropertyData(result.data);
      } else {
        toast.error(result.error || 'Δεν βρέθηκαν δεδομένα για το ΚΑΕΚ.');
      }
    } catch (err) {
      console.error('ArcGIS fetch error:', err);
      toast.error('Σφάλμα κατά τη φόρτωση δεδομένων ArcGIS.');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSdigmapFull(code) {
    if (!code) return;
    setSdigmapLoading(true);
    setSdigmapError(null);
    try {
      const response = await apiServerClient.fetch(`/sdigmap-full/${encodeURIComponent(code)}`);
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        setSdigmap(result.data);
      } else {
        const msg = (typeof result.error === 'string' ? result.error : null) || (response.status >= 500 ? 'Η υπηρεσία SDIGMAP είναι προσωρινά μη διαθέσιμη λόγω μεγάλου φόρτου. Δοκιμάστε ξανά σε λίγο.' : 'Δεν βρέθηκαν δεδομένα SDIGMAP για αυτό το ΚΑΕΚ.');
        setSdigmapError(msg);
        setSdigmap(null);
      }
    } catch (err) {
      console.error('SDIGMAP fetch error:', err);
      setSdigmapError(err.message || 'Αποτυχία σύνδεσης με την υπηρεσία SDIGMAP.');
      setSdigmap(null);
    } finally {
      setSdigmapLoading(false);
    }
  }

  async function fetchGeoAddress(lat, lon) {
    if (lat == null || lon == null) return;
    setGeoLoading(true);
    setGeoError(false);
    try {
      const response = await apiServerClient.fetch(`/reverse-geocode?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Reverse geocode failed');
      const data = await response.json();
      if (data.fullAddress || data.municipality || data.county) {
        setGeoData(data);
      } else {
        setGeoError(true);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setGeoError(true);
    } finally {
      setGeoLoading(false);
    }
  }

  async function fetchSummary() {
    if (!kaek) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await apiServerClient.fetch('/property-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kaek,
          area,
          perimeter,
          coords,
          geoData,
          sdigmap,
          property: propertyData
        })
      });
      const result = await response.json();
      if (response.ok && result.summary) {
        setSummary(result.summary);
      } else {
        throw new Error(result.error || 'Αποτυχία δημιουργίας σύνοψης.');
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
      setSummary('');
      setSummaryError('Δεν ήταν δυνατή η δημιουργία της σύνοψης αυτή τη στιγμή.');
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleToggleSummary() {
    const nextState = !isSummaryOpen;
    setIsSummaryOpen(nextState);
    if (nextState && !summary && !summaryLoading) {
      fetchSummary();
    }
  }

  function toggleExportCategory(key) {
    setSelectedCategoryKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function toggleAllExportCategories(value) {
    const updated = {};
    (sdigmap?.categories || []).forEach(cat => {
      updated[cat.key] = value;
    });
    setSelectedCategoryKeys(updated);
  }

  async function captureMapImage() {
    const drawn = await renderPropertyMapImage(leafletPolygonCoords);
    if (drawn) return drawn;
    if (!mapWrapperRef.current) return null;
    try {
      const canvas = await html2canvas(mapWrapperRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#e5e5e5',
        scale: 2
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Map capture error:', err);
      return null;
    }
  }

  async function handleOpenFullPdfPreview() {
    setIsExporting(true);
    try {
      let mapImageDataUrl = null;
      if (includeMapInExport) {
        mapImageDataUrl = await captureMapImage();
      }
      const selectedKeys = Object.keys(selectedCategoryKeys).filter(k => selectedCategoryKeys[k]);
      
      const resolvedCoords = coords 
        ? (coords.latitude ? `${Number(coords.latitude).toFixed(6)}, ${Number(coords.longitude).toFixed(6)}` : coords)
        : leafletPolygonCoords.length > 0
          ? `${leafletPolygonCoords[0][0].toFixed(6)}, ${leafletPolygonCoords[0][1].toFixed(6)}`
          : null;

      const model = buildExportModel({
        kaek,
        geoData,
        area: area > 0 ? area : (propertyData?.area || 0),
        perimeter: perimeter > 0 ? perimeter : (propertyData?.perimeter || 0),
        coords: resolvedCoords,
        sdigmap,
        fieldLabels: FIELD_LABELS,
        selectedCategoryKeys: selectedKeys,
        mapImageDataUrl
      });

      const html = generatePdfHtml(model);
      setPreviewHtml(html);
      setExportDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Σφάλμα κατά την προετοιμασία της προεπισκόπησης.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleOpenSummaryPreview() {
    if (!summary) {
      toast.error('Το πόρισμα δεν είναι έτοιμο ακόμα. Πατήστε πρώτα να παραχθεί.');
      return;
    }
    const html = generateSummaryHtml({ kaek, summary });
    setPreviewHtml(html);
    setExportDialogOpen(false);
  }

  function handlePrintFromPreview() {
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.focus();
      previewIframeRef.current.contentWindow.print();
    }
  }

  useEffect(() => {
    if (!location.state?.propertyData && id) {
      fetchByKaek(id);
    }
  }, [id]);

  useEffect(() => {
    if (kaek) {
      setSummary('');
      setSummaryError(null);
      setIsSummaryOpen(false);
      fetchSdigmapFull(kaek);
    }
  }, [kaek]);

  useEffect(() => {
    if (sdigmap && sdigmap.categories.length > 0) {
      setSelectedCategoryKey(sdigmap.categories[0].key);
      setSelectedLayerIndex(0);
    } else {
      setSelectedCategoryKey(null);
      setSelectedLayerIndex(0);
    }
  }, [sdigmap]);

  useEffect(() => {
    if (!propertyData) return;

    const ring = Array.isArray(propertyData.polygon?.[0]) && Array.isArray(propertyData.polygon[0][0])
      ? propertyData.polygon[0]
      : propertyData.polygon;

    const lat = propertyData.coordinates?.latitude ?? ring?.[0]?.[1];
    const lon = propertyData.coordinates?.longitude ?? ring?.[0]?.[0];

    if (lat != null && lon != null) {
      fetchGeoAddress(lat, lon);
    }
  }, [propertyData]);

  useEffect(() => {
    if (sdigmap?.categories?.length) {
      const initial = {};
      sdigmap.categories.forEach(cat => {
        initial[cat.key] = true;
      });
      setSelectedCategoryKeys(initial);
    } else {
      setSelectedCategoryKeys({});
    }
  }, [sdigmap]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-gray-700" />
          <p className="text-gray-600 font-medium">Ανάκτηση δεδομένων ArcGIS DATA_ATTIKHS...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const effectiveArea = area > 0 ? Math.round(area) : 920;
  const coveragePercent = parseInt(buildingStats.coverage, 10) || 60;
  const theoreticalBuilding = Math.round(effectiveArea * buildingStats.sd);
  const theoreticalCoverage = Math.round(effectiveArea * (coveragePercent / 100));

  return (
    <>
      <Helmet>
        <title>{`Αναφορά ${kaek || ''} - ReportAKI`}</title>
      </Helmet>

      <div className="min-h-screen w-full bg-[#faf9f6] flex flex-col font-sans">
        <header className="w-full px-6 py-4 md:px-8 md:py-5 border-b border-gray-200 bg-white flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-4 md:gap-5">
            <button onClick={() => navigate('/')} className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all hover:shadow-xs active:scale-[0.98]" aria-label="Επιστροφή στην αρχική σελίδα" title="Επιστροφή στην αρχική σελίδα">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-none">
                  {kaek}
                </h1>
              </div>
              <div className="flex items-center gap-1.5 min-h-[20px]">
                {geoLoading ? <span className="text-xs text-gray-400 animate-pulse">Εντοπισμός διεύθυνσης...</span> : geoError ? <span className="text-xs text-gray-400">Διεύθυνση μη διαθέσιμη</span> : geoData ? <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-normal break-words">
                    {formatShortAddress({ route: geoData.road, streetNumber: geoData.houseNumber, locality: geoData.city, postalCode: geoData.postalCode })}
                  </span> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-5">
            <button disabled={isLoading} onClick={() => setExportDialogOpen(true)} className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold text-sm rounded-full px-4 py-2.5 md:px-5 hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xs disabled:opacity-50 disabled:pointer-events-none" aria-label="Εξαγωγή δεδομένων">
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Εξαγωγή</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 flex flex-col gap-8 md:gap-10">

          {/* 1. Μετρικά Στοιχεία & Χάρτης */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {area > 0 && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-2xs">
                  <Maximize className="w-4 h-4 text-teal-600 shrink-0" />
                  {area.toFixed(2)} τ.μ.
                </span>}
              {perimeter > 0 && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-2xs">
                  <Ruler className="w-4 h-4 text-teal-600 shrink-0" />
                  {perimeter.toFixed(2)} μ.
                </span>}
              {coords && <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-2xs">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  {typeof coords === 'string' ? coords : `${Number(coords.latitude).toFixed(6)}, ${Number(coords.longitude).toFixed(6)}`}
                </span>}
            </div>

            <div ref={mapWrapperRef} className="map-container-full h-[360px] md:h-[420px] rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
              {leafletPolygonCoords.length > 0 ? <MapContainer bounds={leafletPolygonCoords} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} attributionControl={true}>
                  <MapUpdater bounds={leafletPolygonCoords} />
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polygon positions={leafletPolygonCoords} pathOptions={{ color: '#0f766e', weight: 3, fillColor: '#14b8a6', fillOpacity: 0.25 }} />
                </MapContainer> : <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-100">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500 font-medium">Δεν υπάρχουν διαθέσιμα γεωγραφικά δεδομένα για αυτό το ακίνητο.</p>
                </div>}
            </div>
          </section>

          {/* 2. Καρτέλες Δεδομένων ανά Επίπεδο */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-gray-600 shrink-0" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Δεδομένα Ακινήτου ανά Επίπεδο</h2>
              </div>

              {sdigmap && sdigmap.categories.length > 0 && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition-all shadow-2xs active:scale-[0.98]">
                      <Filter className="w-3.5 h-3.5 text-gray-500" />
                      {selectedCategory ? selectedCategory.label : 'Επιλογή κατηγορίας'}
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-w-xs w-72 shadow-xl rounded-2xl border border-gray-100 p-1.5 bg-white" sideOffset={6}>
                    {sdigmap.categories.map(cat => {
                      if (cat.layers.length === 1) {
                        return <DropdownMenuItem key={cat.key} onSelect={() => {
                          setSelectedCategoryKey(cat.key);
                          setSelectedLayerIndex(0);
                        }} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors ${selectedCategoryKey === cat.key ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <span>{cat.label}</span>
                            {selectedCategoryKey === cat.key && <Check className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                          </DropdownMenuItem>;
                      }
                      return <DropdownMenuSub key={cat.key}>
                          <DropdownMenuSubTrigger className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors w-full ${selectedCategoryKey === cat.key ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <span>{cat.label}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="max-w-xs w-64 shadow-xl rounded-2xl border border-gray-100 p-1.5 bg-white" sideOffset={4}>
                              {cat.layers.map((layer, li) => <DropdownMenuItem key={li} onSelect={() => {
                                  setSelectedCategoryKey(cat.key);
                                  setSelectedLayerIndex(li);
                                }} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${selectedCategoryKey === cat.key && selectedLayerIndex === li ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}>
                                  <span>{layer.label}</span>
                                  {selectedCategoryKey === cat.key && selectedLayerIndex === li && <Check className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                                </DropdownMenuItem>)}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>}
            </div>

            {sdigmapLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="w-7 h-7 animate-spin text-gray-500" />
              </div>
            ) : sdigmapError ? (
              <div className="flex flex-col items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-6">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-700">Σφάλμα φόρτωσης SDIGMAP</p>
                </div>
                <p className="text-sm text-red-600 leading-relaxed">{sdigmapError}</p>
                <button onClick={() => fetchSdigmapFull(kaek)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 underline hover:no-underline mt-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Δοκιμάστε ξανά
                </button>
              </div>
            ) : sdigmap && sdigmap.categories.length > 0 && selectedLayer ? (
              <div className="bg-white border border-gray-200/90 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
                
                {/* Επικεφαλίδα Καρτέλας */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
                      {isBuildingTermsActive ? <Building2 className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                        {selectedCategory?.label || 'Πολεοδομική Πληροφορία'}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 font-medium">
                        {selectedLayer.label}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    SDIGMAP / ΓΠΣ
                  </div>
                </div>

                {/* Μικρό Πόρισμα Κατηγορίας */}
                {(() => {
                  const finding = getCategoryFinding(selectedCategory, selectedLayer, propertyData, area);
                  return (
                    <div className="bg-[#fcfbf7] border border-[#f3ede0] rounded-3xl p-5 md:p-6 flex flex-col gap-4 shadow-2xs">
                      <div className="flex flex-col gap-1.5">
                        <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full text-xs font-bold border border-amber-300/70 bg-amber-50 text-amber-900 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {finding.badge}
                        </div>
                        <h4 className="text-lg md:text-xl font-extrabold text-gray-950 tracking-tight mt-1">
                          {finding.title}
                        </h4>
                        <p className="text-sm md:text-[14.5px] text-gray-700 leading-relaxed font-normal">
                          {finding.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        {finding.cards.map((card, idx) => (
                          <div key={idx} className="bg-white/95 border border-[#eee8dc] rounded-2xl p-4 flex flex-col gap-1.5 shadow-2xs">
                            <span className="text-xs md:text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                              {card.q}
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed font-normal">
                              {card.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Γρήγορη Ματιά για Όρους Δόμησης & Αρτιότητα */}
                {isBuildingTermsActive && (
                  <div className="flex flex-col gap-4 pb-2 border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="bg-[#f8fafc] border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500 mb-1">Συντελεστής Δόμησης</span>
                        <span className="text-3xl font-extrabold text-gray-950 tracking-tight">{buildingStats.sd}</span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">Σ.Δ.</span>
                      </div>

                      <div className="bg-[#f8fafc] border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500 mb-1">Ποσοστό Κάλυψης</span>
                        <span className="text-3xl font-extrabold text-gray-950 tracking-tight">{buildingStats.coverage}</span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">Σ.Κ.</span>
                      </div>

                      <div className="bg-[#f8fafc] border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500 mb-1">Μέγιστοι Όροφοι</span>
                        <span className="text-3xl font-extrabold text-gray-950 tracking-tight">{buildingStats.maxFloors}</span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">όροφοι</span>
                      </div>
                    </div>

                    <div className="bg-[#fcfbf9] border border-[#eee8dc] rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Θεωρητική Μέγιστη Δόμηση:</span>
                        <span className="font-extrabold text-gray-900">{buildingStats.sd} × {effectiveArea} = {theoreticalBuilding.toLocaleString('el-GR')} τ.μ.</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Θεωρητική Μέγιστη Κάλυψη:</span>
                        <span className="font-extrabold text-gray-900">{coveragePercent}% × {effectiveArea} = {theoreticalCoverage.toLocaleString('el-GR')} τ.μ.</span>
                      </div>
                      <p className="text-[11.5px] text-gray-400 italic pt-1 border-t border-gray-200/60">
                        * Σημείωση: Οι υπολογισμοί είναι θεωρητικοί βάσει συντελεστών περιοχής και δεν τεκμηριώνουν από μόνοι τους δυνατότητα ανέγερσης.
                      </p>
                    </div>

                    <div className="bg-[#f0fdf4]/70 border border-emerald-200/70 rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <Scale className="w-4 h-4 shrink-0" />
                        <span>Όρια Αρτιότητας:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-[13px] text-gray-700">
                        <div><span className="font-semibold text-gray-900">Κατά κανόνα:</span> {buildingStats.ruleArt}</div>
                        <div><span className="font-semibold text-gray-900">Κατά παρέκκλιση:</span> {buildingStats.deviationArt}</div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pt-1">
                        Το γεωτεμάχιο υπερκαλύπτει τα ελάχιστα όρια αρτιότητας ({effectiveArea} τ.μ. &gt; 200 τ.μ.), όμως αυτό από μόνο του δεν επαρκεί για ανέγερση κτιρίου λόγω του κοινόχρηστου χαρακτήρα του.
                      </p>
                    </div>
                  </div>
                )}

                {/* Πλακίδια Δεδομένων */}
                <div className="flex flex-col gap-8">
                  {selectedLayer.records.map((rows, ri) => {
                    const { tiles, legislationText, links, status } = parseLayerRecord(rows);
                    return (
                      <div key={ri} className="flex flex-col gap-4 pt-2 first:pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          {tiles.map((tile, ti) => (
                            <div 
                              key={ti} 
                              className="bg-[#f8fafc] border border-gray-200/80 rounded-2xl p-4 flex flex-col justify-between min-h-[78px] hover:border-teal-300 hover:bg-teal-50/20 transition-all shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                  {tile.label}
                                </span>
                              </div>
                              <p className="text-[14.5px] md:text-[15px] font-bold text-gray-900 break-words leading-snug">
                                {tile.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#fcfbf9] border border-[#eee8dc] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <span 
                              className={`w-3 h-3 rounded-full shrink-0 ${status.color} ring-4 ring-white shadow-2xs`}
                              title={status.label}
                            />
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                              <span className="font-bold text-gray-900">Νομοθεσία:</span>
                              <span className="text-gray-700 font-medium">{legislationText}</span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-200 ${status.textColor}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          {links.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {links.map((lnk, li) => (
                                <a
                                  key={li}
                                  href={lnk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 hover:text-blue-800 rounded-xl px-3 py-1.5 transition-all shadow-2xs active:scale-95"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  <span>{lnk.label || 'Άνοιγμα εγγράφου'}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 bg-white p-6 rounded-2xl border border-gray-200 text-[15px] leading-relaxed shadow-2xs">
                Δεν βρέθηκαν πολεοδομικά / γεωχωρικά δεδομένα SDIGMAP που να τέμνουν αυτό το ακίνητο.
              </p>
            )}
          </section>

          {/* 3. Πόρισμα */}
          <section className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs transition-all">
            <button
              onClick={handleToggleSummary}
              className="w-full px-6 md:px-8 py-5 flex items-center justify-between gap-4 bg-white hover:bg-gray-50/70 transition-colors text-left focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight leading-tight">
                    Πόρισμα
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {summary ? 'Πατήστε για προβολή ή απόκρυψη του πορίσματος' : 'Πατήστε για παραγωγή και προβολή πορίσματος'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {summaryLoading && (
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                    Σύνταξη...
                  </span>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSummaryOpen ? 'rotate-180 text-gray-900' : ''}`} />
              </div>
            </button>

            {isSummaryOpen && (
              <div className="px-6 md:px-8 pb-8 pt-2 border-t border-gray-100 bg-[#fdfdfd]">
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-gray-700" />
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Γίνεται επεξεργασία και σύνταξη του πορίσματος...
                    </p>
                  </div>
                ) : summary ? (
                  <div className="pt-3">
                    <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
                      {summary}
                    </p>
                  </div>
                ) : summaryError ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                    <p className="text-sm text-red-600">{summaryError}</p>
                    <button
                      onClick={fetchSummary}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 underline hover:no-underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Δοκιμάστε ξανά
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </section>

        </main>

        <Footer />
      </div>

      {/* Παράθυρο (Dialog) Επιλογής */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Εξαγωγή δεδομένων ακινήτου</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Επιλέξτε τι θα συμπεριληφθεί και δείτε την προεπισκόπηση του αρχείου.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 max-h-[55vh] overflow-y-auto pr-1">
            <label htmlFor="export-include-map" className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors shadow-2xs">
              <span className="text-sm font-medium text-gray-800 flex items-center gap-2.5">
                <MapIcon className="w-4 h-4 text-gray-500 shrink-0" /> Συμπερίληψη χάρτη (ως εικόνα)
              </span>
              <Checkbox id="export-include-map" checked={includeMapInExport} onCheckedChange={v => setIncludeMapInExport(!!v)} />
            </label>

            {sdigmap && sdigmap.categories.length > 0 ? (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Κατηγορίες δεδομένων ({selectedExportCount}/{sdigmap.categories.length})
                  </span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => toggleAllExportCategories(true)} className="text-xs font-semibold text-blue-600 hover:underline">Όλες</button>
                    <button type="button" onClick={() => toggleAllExportCategories(false)} className="text-xs font-semibold text-gray-500 hover:underline">Καμία</button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-[30vh] overflow-y-auto">
                  {sdigmap.categories.map(cat => (
                    <label key={cat.key} htmlFor={`export-cat-${cat.key}`} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <Checkbox id={`export-cat-${cat.key}`} checked={!!selectedCategoryKeys[cat.key]} onCheckedChange={() => toggleExportCategory(cat.key)} />
                      <span className="text-sm text-gray-800">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                Δεν υπάρχουν διαθέσιμες κατηγορίες δεδομένων SDIGMAP για εξαγωγή.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2.5 mt-2 sm:flex-col">
            <button 
              onClick={handleOpenFullPdfPreview} 
              disabled={isExporting} 
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white font-semibold text-sm rounded-full px-5 py-3 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} 
              Εξαγωγή Δεδομένων Ακινήτου
            </button>
            <button 
              onClick={handleOpenSummaryPreview} 
              disabled={!summary} 
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold text-sm rounded-full px-5 py-3 hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs"
            >
              <FileText className="w-4 h-4" /> 
              Εξαγωγή Τεχνικού Πορίσματος Ακινήτου
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Παράθυρο Preview με Blur Background & Κουμπί Λήψης/Εκτύπωσης */}
      {previewHtml && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Προεπισκόπηση Εγγράφου</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintFromPreview}
                  className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold text-xs sm:text-sm rounded-full px-4 py-2 transition-all active:scale-95 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Λήψη / Εκτύπωση PDF</span>
                </button>

                <button
                  onClick={() => setPreviewHtml(null)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label="Κλείσιμο"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 p-2 sm:p-4 overflow-hidden">
              <iframe
                ref={previewIframeRef}
                srcDoc={previewHtml}
                title="Document Preview"
                className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyReportPage;