// Skopiowana funkcja z frontend/src/pages/Rental/RentalForm.jsx
function getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

describe('getDaysDifference', () => {
    it('returns correct number of days between two dates', () => {
        expect(getDaysDifference('2025-06-01', '2025-06-05')).toBe(4);
        expect(getDaysDifference('2025-07-01', '2025-07-01')).toBe(0);
        expect(getDaysDifference('2025-07-01', '2025-07-04')).toBe(3);
    });
});
