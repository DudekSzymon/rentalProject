import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label UI component', () => {
    it('renders label with text', () => {
        render(<Label htmlFor="test-input">Test Label</Label>);
        expect(screen.getByText('Test Label')).toBeInTheDocument();
    });
});
