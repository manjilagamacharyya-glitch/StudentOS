import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'StudentOS | Attendance Tracker',
  description: 'Modern attendance management and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-white antialiased min-h-screen relative overflow-x-hidden bg-black">
        
        {/* THE PREMIUM ANIMATED BACKGROUND LAYER */}
        <div className="fixed inset-0 z-[-1] bg-[linear-gradient(-45deg,#000000,#0a0f1c,#110914,#000000)] bg-[length:400%_400%] animate-aurora"></div>
        
        <AuthProvider>
          {/* MAIN APP CONTENT */}
          {children}
        </AuthProvider>
        
        {/* GLOBAL NOTIFICATION SYSTEM */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            className: 'glass-card border-white/10 text-white font-sans tracking-wide',
            style: {
              background: 'rgba(25, 25, 25, 0.7)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              color: '#F5F5F7',
            },
          }} 
        />
      </body>
    </html>
  );
}