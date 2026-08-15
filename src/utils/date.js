/**
 * ------------------------------------------------------------------
 * TIMEZONE SSOT (Single Source Of Truth)
 * ------------------------------------------------------------------
 * Règle d'or :
 * - BDD (Supabase / Backend) : Toujours en ISO UTC (ex: 2026-02-15T16:00:00.000Z)
 * - Saisie Utilisateur : Heure Locale (ex: 17:00 Paris) -> Converti en UTC pour stockage
 * - Affichage : Heure UTC -> Converti en Heure Locale pour affichage
 * ------------------------------------------------------------------
 */

/**
 * [WRITE] Convertit une date/heure locale (saisie utilisateur) en ISO UTC pour la BDD.
 * @param {string|Date} dateInput - Date object, ou string 'YYYY-MM-DD', ou 'YYYY-MM-DDTHH:MM'
 * @param {string} [timeStr] - Optionnel 'HH:MM' string si dateInput est juste une date
 * @returns {string} ISO String UTC (ex: "2026-02-15T16:00:00.000Z")
 */
export const toUTCISO = (dateInput, timeStr = '00:00:00') => {
  if (!dateInput) return null;

  let localDateObj;

  if (dateInput instanceof Date) {
    localDateObj = dateInput;
  } else {
    const dateStr = dateInput.includes('T') ? dateInput : `${dateInput}T${timeStr}`;
    localDateObj = new Date(dateStr);
  }

  if (isNaN(localDateObj.getTime())) {
    console.error("toUTCISO: Invalid Date", dateInput, timeStr);
    return null;
  }

  return localDateObj.toISOString();
};

/**
 * [READ] Convertit une date ISO UTC (venant de la BDD) en objet Date local.
 * @param {string} isoString - "2026-02-15T16:00:00.000Z"
 * @returns {Date} Objet Date configuré sur le fuseau du navigateur
 */
export const toLocalDateObj = (isoString) => {
  if (!isoString) return new Date();
  return new Date(isoString);
};

/**
 * [DISPLAY] Affiche une date UTC au format local convivial (JJ/MM/YYYY HH:mm)
 * @param {string} isoString 
 * @param {boolean} withTime 
 */
export const displayDateTime = (isoString, withTime = true) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';

  const datePart = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (!withTime) return datePart;

  const timePart = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${datePart} ${timePart}`;
};

/**
 * [DISPLAY] Retourne YYYY-MM-DD local pour remplir un input type="date"
 * @param {string} isoString 
 */
export const toInputDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  const localISODate = new Date(d.getTime() - offset).toISOString().split('T')[0];
  return localISODate;
};

export const getMonthBoundaries = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return {
    startStr: start.toISOString(),
    endStr: end.toISOString(),
  };
};

export const formatDisplayDate = (dateStr) => {
  if (dateStr && dateStr.includes('T')) return displayDateTime(dateStr, false);
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
