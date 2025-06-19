import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input UI component', () => {
    it('renders with placeholder', () => {
        render(<Input placeholder="Test input" data-testid="test-input" />);
        expect(screen.getByTestId('test-input')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });
});
