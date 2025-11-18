function formatPrice(price, type) {
    if (!price) return 'N/A';
    
    const numericPart = price.toString().replace(/[^\d.]/g, ''); 
    const formatted = new Intl.NumberFormat('ar-EG', { 
        maximumFractionDigits: 0 
    }).format(numericPart);
    
    const currency = 'ج.م.';
    const period = (type && type === 'إيجار') ? '/ شهر' : '';
    
    return `${formatted} ${currency}${period}`;
}

function getTypeTag(type) {
    if (type === 'بيع') {
        return `<span class="property-tag tag-sale">بيع</span>`;
    }
    if (type === 'إيجار') {
        return `<span class="property-tag tag-rent">إيجار</span>`;
    }
    return '';
}