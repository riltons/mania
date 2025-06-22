import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateFormatOptions {
    includeTime?: boolean;
    includeYear?: boolean;
    relative?: boolean;
}

/**
 * Formata uma data para o padrão brasileiro
 */
export const formatDate = (
    dateString: string, 
    options: DateFormatOptions = {}
): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    const { includeTime = true, includeYear = true, relative = false } = options;
    
    if (relative) {
        return formatDistanceToNow(date, { 
            addSuffix: true, 
            locale: ptBR 
        });
    }
    
    if (includeTime) {
        return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
    
    if (includeYear) {
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    
    return format(date, "dd 'de' MMMM", { locale: ptBR });
};

/**
 * Formata uma data para o formato dd/mm/yyyy
 */
export const formatDateBR = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formata uma data para o formato dd/mm/yyyy HH:mm
 */
export const formatDateTimeBR = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};
