import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle, ArrowLeft, Package, Calendar, User } from 'lucide-react';

const SimplePayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const rental = location.state?.rental;
    const equipment = location.state?.equipment;

    const handleOfflinePayment = () => {
        alert('Wypożyczenie utworzone! Admin zatwierdzi płatność offline.');
        navigate('/equipment');
    };

    if (!rental || !equipment) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">Brak danych wypożyczenia</h2>
                    <Button onClick={() => navigate('/equipment')}>Powrót do katalogu</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => navigate('/equipment')} variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Powrót do katalogu
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Płatność za wypożyczenie</h1>
                            <p className="text-gray-400">Wypożyczenie zostało utworzone</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                            Wypożyczenie utworzone pomyślnie!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                            <div className="flex items-start space-x-3">
                                <Package className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-white">{equipment.name}</h4>
                                    <p className="text-sm text-gray-400">{equipment.brand} {equipment.model}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-300">
                                        <strong>Od:</strong> {new Date(rental.start_date).toLocaleDateString('pl-PL')}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        <strong>Do:</strong> {new Date(rental.end_date).toLocaleDateString('pl-PL')}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-600 pt-3">
                                <div className="flex justify-between text-white font-semibold">
                                    <span>Do zapłaty:</span>
                                    <span>{rental.total_price} zł</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold text-white">Opcje płatności</h3>
                            
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-400 mb-2">Płatność offline</h4>
                                <p className="text-gray-300 text-sm mb-4">
                                    Skontaktuj się z nami aby zapłacić gotówką lub przelewem. 
                                    Administrator zatwierdzi płatność.
                                </p>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <p>📞 +48 123 456 789</p>
                                    <p>✉️ kontakt@spellbudex.pl</p>
                                </div>
                            </div>

                            <Button onClick={handleOfflinePayment} className="w-full">
                                Rozumiem - kontakt z administracją
                            </Button>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            ID wypożyczenia: #{rental.id}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SimplePayment;