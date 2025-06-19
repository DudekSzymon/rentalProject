function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

describe('formatDate', () => {
    it('formats date to Polish locale', () => {
        expect(formatDate('2025-07-01')).toMatch(/lipca/); // np. "1 lipca 2025"
    });
});
