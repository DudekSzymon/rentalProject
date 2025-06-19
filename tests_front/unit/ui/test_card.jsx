import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('Card UI component', () => {
    it('renders card with header and content', () => {
        render(
            <Card data-testid="test-card">
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Card content</p>
                </CardContent>
            </Card>
        );
        expect(screen.getByTestId('test-card')).toBeInTheDocument();
        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });
});
