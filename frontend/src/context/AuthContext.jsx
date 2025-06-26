import React, { createContext, useContext, useState, useEffect } from 'react';


const AuthContext = createContext();


export const useAuth = () => {
   const context = useContext(AuthContext);
   // Sprawdzenie czy hook jest używany wewnątrz AuthProvider
   if (!context) {
       throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
};

// Provider komponenta - dostarcza kontekst uwierzytelniania do całej aplikacji
export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);       
   const [loading, setLoading] = useState(true); 

   useEffect(() => {
       const checkAuth = async () => {
           // Pobranie tokenu z localStorage
           const token = localStorage.getItem('access_token');
           if (!token) {

               setLoading(false);
               return;
           }

           try {
               // Sprawdzenie ważności tokenu
               const response = await fetch('http://localhost:8000/api/auth/me', {
                   headers: { 'Authorization': `Bearer ${token}` }
               });

               if (response.ok) {
                   const userData = await response.json();
                   localStorage.setItem('user', JSON.stringify(userData));
                   setUser({
                       ...userData,
                       isAdmin: userData.role === 'admin'  // Dodanie flagi administratora
                   });
               } else {
                   // Token nieważny - usuń z localStorage
                   localStorage.removeItem('access_token');
               }
           } catch (error) {
               console.error('Auth check failed:', error);
               localStorage.removeItem('access_token');
           }
           
           // Zakończ ładowanie po sprawdzeniu autoryzacji
           setLoading(false);
       };

       checkAuth();
   }, []);

   // Funkcja logowania użytkownika (email + hasło)
   const login = async (credentials) => {
       try {
           // Wysłanie żądania logowania do API
           const response = await fetch('http://localhost:8000/api/auth/login', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(credentials),
           });

           if (!response.ok) {
               // Obsługa błędów logowania
               const errorData = await response.json();
               throw new Error(errorData.detail || 'Błąd logowania');
           }

           const data = await response.json();
           
           if (data.access_token) {
               // Zapisanie tokenu i danych użytkownika
               localStorage.setItem('access_token', data.access_token);
               localStorage.setItem('user', JSON.stringify(data.user));
               setUser({
                   ...data.user,
                   isAdmin: data.user.role === 'admin'  //flaga adminia
               });
               return { success: true };
           }
       } catch (error) {
           // Zwrócenie informacji o błędzie
           return { success: false, error: error.message };
       }
   };

   const googleLogin = async (googleToken) => {
       try {
           // Wysłanie tokenu Google
           const response = await fetch('http://localhost:8000/api/auth/google', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ token: googleToken }),
           });

           if (!response.ok) {
               // Obsługa błędów logowania Google
               const errorData = await response.json();
               throw new Error(errorData.detail || 'Błąd logowania przez Google');
           }

           const data = await response.json();
           
           if (data.access_token) {
               localStorage.setItem('access_token', data.access_token);
               localStorage.setItem('user', JSON.stringify(data.user));
               setUser({
                   ...data.user,
                   isAdmin: data.user.role === 'admin'  // Dodanie flagi administratora
               });
               return { success: true };
           }
       } catch (error) {
           // Zwrócenie informacji o błędzie
           return { success: false, error: error.message };
       }
   };

   // Funkcja wylogowania użytkownika
   const logout = () => {
       localStorage.removeItem('access_token');  
       setUser(null);                           // Wyczyść stan użytkownika
   };

   // Obiekt wartości dostarczanych przez kontekst
   const value = {
       user,        
       loading,        
       login,          
       googleLogin,    
       logout,         
       setUser
   };

   // Provider udostępniający kontekst wszystkim komponentom potomnym
   return (
       <AuthContext.Provider value={value}>
           {children}
       </AuthContext.Provider>
   );
};