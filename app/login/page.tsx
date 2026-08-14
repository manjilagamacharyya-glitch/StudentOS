'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(isLogin ? "Signing in..." : "Creating account...");
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!", { id: toastId });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message.replace("Firebase: ", ""), { id: toastId });
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    const toastId = toast.loading("Connecting to Google...");
    try {
      await signInWithPopup(auth, provider);
      toast.success("Logged in with Google!", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to sign in with Google", { id: toastId });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-[32px] relative overflow-hidden isolate"
      >
        {/* Ambient background glow inside the card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accentBlue/20 blur-[100px] -z-10 rounded-full"></div>
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
            StudentOS
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Your academic operating system.</p>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <input 
            type="email" 
            placeholder="Email address" 
            value={email} onChange={(e) => setEmail(e.target.value)} required 
            className="w-full bg-black/50 border border-white/10 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-accentBlue transition-colors" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} onChange={(e) => setPassword(e.target.value)} required 
            className="w-full bg-black/50 border border-white/10 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-accentBlue transition-colors" 
          />
          <button 
            type="submit" 
            className="w-full bg-white text-black py-4 rounded-full font-bold mt-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative flex items-center py-4 mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-medium uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="w-full bg-surfaceGlass border border-white/10 text-white py-4 rounded-full font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-gray-400 mt-8 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-white ml-2 font-bold hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </main>
  );
}