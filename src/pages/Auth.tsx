import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Validation schemas
const emailSchema = z.string().trim().email({ message: "সঠিক ইমেইল ঠিকানা দিন" }).max(255, { message: "ইমেইল ২৫৫ অক্ষরের বেশি হতে পারবে না" });
const passwordSchema = z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }).max(72, { message: "পাসওয়ার্ড ৭২ অক্ষরের বেশি হতে পারবে না" });
const nameSchema = z.string().trim().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে" }).max(100, { message: "নাম ১০০ অক্ষরের বেশি হতে পারবে না" });

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Validate email
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    // Validate password
    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    // For signup
    if (!isLogin) {
      // Validate name
      const nameResult = nameSchema.safeParse(formData.name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
      
      // Validate confirm password
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "পাসওয়ার্ড মিলছে না";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "লগইন ব্যর্থ",
              description: "ইমেইল বা পাসওয়ার্ড সঠিক নয়",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "ইমেইল যাচাই করুন",
              description: "আপনার ইমেইলে পাঠানো লিংকে ক্লিক করে ইমেইল যাচাই করুন",
              variant: "destructive",
            });
          } else {
            toast({
              title: "কিছু একটা সমস্যা হয়েছে",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }
        
        toast({
          title: "স্বাগতম! 🎉",
          description: "সফলভাবে লগইন হয়েছে",
        });
        navigate('/', { replace: true });
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "একাউন্ট আছে",
              description: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। লগইন করুন।",
              variant: "destructive",
            });
          } else {
            toast({
              title: "কিছু একটা সমস্যা হয়েছে",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }
        
        toast({
          title: "রেজিস্ট্রেশন সফল! 🎉",
          description: "আপনার ইমেইলে একটি যাচাই লিংক পাঠানো হয়েছে। ইমেইল যাচাই করে লগইন করুন।",
        });
        setIsLogin(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            আ
          </div>
          <h1 className="text-2xl font-bold text-foreground">আশমা টেক সিআরএম</h1>
          <p className="text-muted-foreground mt-1">আপনার ব্যবসার সম্পূর্ণ সমাধান</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                লগইন
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                রেজিস্টার
              </button>
            </div>
          </CardHeader>
          
          <CardContent>
            <form key={isLogin ? 'login' : 'register'} onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name">পুরো নাম</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="আপনার নাম লিখুন"
                    className="mt-1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name}</p>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm mt-1">{errors.password}</p>
                )}
              </div>
              
              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isLogin ? (
                  <LogIn className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isLogin ? 'লগইন করুন' : 'রেজিস্টার করুন'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "অ্যাকাউন্ট নেই? " : "ইতোমধ্যে অ্যাকাউন্ট আছে? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'রেজিস্টার করুন' : 'লগইন করুন'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
