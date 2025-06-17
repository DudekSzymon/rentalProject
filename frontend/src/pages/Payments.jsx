// src/pages/Payments.jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Komponent formularza płatności
const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(100.50);

  // Logowanie i tworzenie payment intent
  const createPaymentIntent = async () => {
    try {
      setMessage('Logowanie...');
      
      // 1. Logowanie
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'string'
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Błąd logowania');
      }

      const loginData = await loginResponse.json();
      const token = loginData.access_token;
      
      setMessage('Tworzenie płatności...');

      // 2. Tworzenie payment intent
      const paymentResponse = await fetch('http://localhost:8000/api/payments/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'pln'
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.detail || 'Błąd tworzenia płatności');
      }

      const paymentData = await paymentResponse.json();
      setClientSecret(paymentData.client_secret);
      setMessage('Płatność gotowa! Wprowadź dane karty:');
      
    } catch (error) {
      setMessage('❌ Błąd: ' + error.message);
    }
  };

  // Potwierdzenie płatności
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setMessage('Przetwarzanie płatności...');

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Test User',
            email: 'user@example.com'
          }
        }
      });

      if (error) {
        setMessage('❌ Błąd płatności: ' + error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setMessage('✅ Płatność udana! ID: ' + paymentIntent.id);
        
        // Sprawdź status w naszym API
        setTimeout(() => checkStatus(paymentIntent.id), 2000);
      }
    } catch (error) {
      setMessage('❌ Błąd: ' + error.message);
    }

    setLoading(false);
  };

  // Sprawdzenie statusu
  const checkStatus = async (paymentIntentId) => {
    try {
      // Ponowne logowanie dla sprawdzenia statusu
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'string'
        })
      });

      const loginData = await loginResponse.json();
      const token = loginData.access_token;

      const statusResponse = await fetch(`http://localhost:8000/api/payments/stripe/status/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setMessage(`✅ Status synchronizowany! 
        Stripe: ${statusData.stripe_status}
        Nasz system: ${statusData.our_status}
        Kwota: ${statusData.amount} ${statusData.currency.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Błąd sprawdzania statusu:', error);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'black', 
      color: 'white', 
      minHeight: '100vh', 
      padding: '50px',
      fontFamily: 'Arial'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1>🏗️ Test Płatności Stripe</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h3>Wypożyczenie: Wiertarka Bosch</h3>
          <p>Kwota: {amount} PLN</p>
          
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            step="0.01"
            min="0.50"
            style={{ 
              padding: '10px', 
              fontSize: '16px',
              width: '200px',
              marginBottom: '20px'
            }}
          />
        </div>

        {!clientSecret ? (
          <button 
            onClick={createPaymentIntent}
            style={{
              backgroundColor: '#6772e5',
              color: 'white',
              padding: '15px 30px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            Przygotuj płatność
          </button>
        ) : (
          <form onSubmit={handlePayment}>
            <div style={{
              backgroundColor: '#333',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '5px'
            }}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#fff',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !stripe}
              style={{
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                padding: '15px 30px',
                border: 'none',
                borderRadius: '5px',
                fontSize: '18px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Przetwarzanie...' : `Zapłać ${amount} PLN`}
            </button>
          </form>
        )}

        <div style={{ 
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#222',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <h4>📋 Status:</h4>
          <div style={{ whiteSpace: 'pre-line' }}>
            {message || 'Kliknij "Przygotuj płatność" aby zacząć'}
          </div>
        </div>

        <div style={{ 
          marginTop: '20px',
          fontSize: '14px',
          color: '#aaa'
        }}>
          <p><strong>Testowe karty:</strong></p>
          <p>✅ Sukces: 4242 4242 4242 4242</p>
          <p>❌ Błąd: 4000 0000 0000 0002</p>
          <p>Data: dowolna przyszła, CVC: 123</p>
        </div>
      </div>
    </div>
  );
};

// Główny komponent z Elements Provider
const Payments = () => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Pobierz publishable key z API
    const initStripe = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/payments/stripe/config');
        const config = await response.json();
        setStripePromise(loadStripe(config.publishable_key));
      } catch (error) {
        console.error('Błąd ładowania Stripe:', error);
      }
    };

    initStripe();
  }, []);

  if (!stripePromise) {
    return (
      <div style={{ 
        backgroundColor: 'black', 
        color: 'white', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <h2>Ładowanie Stripe...</h2>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
};

export default Payments;