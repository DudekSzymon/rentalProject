import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button UI component', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
});
