/**
 * Moteur de recherche polyvalent tolérant aux fautes et découpe par mots clés
 * @param {Array} data - Le tableau d'objets à filtrer
 * @param {String} query - La saisie utilisateur
 * @param {Function} formatFn - Fonction de sérialisation d'un élément en chaîne de mots-clés
 */
export const universalSearch = (data, query, formatFn) => {
  if (!query) return data;

  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  return data.filter((item) => {
    const searchableString = formatFn(item).toLowerCase();
    return searchTerms.every((term) => searchableString.includes(term));
  });
};

/**
 * Helper de sérialisation générique pour tout élément possédant un titre, description, date et montant.
 */
export const formatItemForSearch = (item) => {
  const title = item.title || item.name || item.label || '';
  const category = item.category || '';
  const description = item.description || item.notes || '';
  const amount = item.amount !== undefined ? Math.abs(item.amount).toString() : '';

  let datePart = '';
  if (item.date) {
    const dateObj = new Date(item.date);
    if (!isNaN(dateObj.getTime())) {
      const dateStr = typeof item.date === 'string' ? item.date : dateObj.toISOString().split('T')[0];
      const [y, m, d] = dateStr.split('-');
      const months = [
        'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
      ];
      datePart = `${d}-${m}-${y} ${d}/${m}/${y} ${months[dateObj.getMonth()]}`;
    }
  }

  return `${title} ${category} ${description} ${amount} ${amount}€ ${datePart}`.toLowerCase().trim();
};
