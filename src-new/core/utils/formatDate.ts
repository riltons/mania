/**
 * Formata uma string de data para o formato dd/mm/yyyy sem hora
 * @param dateString String de data no formato ISO ou timestamp
 * @returns Data formatada no padrão brasileiro (dd/mm/yyyy)
 */
export const formatDateBR = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};
