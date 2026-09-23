import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Eye, EyeOff, AlertCircle, Zap, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { User } from '../App';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface ModernLoginFormProps {
  onLoginSuccess: (user: User) => void;
  onSwitchToRegister: () => void;
  onBack: () => void;
}

export function ModernLoginForm({ onLoginSuccess, onSwitchToRegister, onBack }: ModernLoginFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError(t('auth.error.email_required'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth.error.password_required'));
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      console.log('Attempting patient login for:', email);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/api/patient/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Patient login response status:', response.status);
      
      const data = await response.json();
      console.log('Patient login response data:', data);

      if (response.ok && data.success) {
        console.log('Login successful for user:', data.user);
        onLoginSuccess(data.user);
      } else {
        const errorMsg = data.error || t('auth.error.login_failed');
        console.error('Patient login error:', errorMsg);
        setEmailError(errorMsg);
      }
    } catch (error) {
      console.error('Patient login network error:', error);
      setEmailError(t('auth.error.server_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>

          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">CareWay</span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-gray-900 mb-2">{t('auth.login.title')}</h1>
              <p className="text-sm text-gray-600">{t('auth.login.desc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm text-gray-700">
                  {t('auth.email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  className={emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {emailError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm text-gray-700">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className={`pr-10 ${passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                    Se souvenir
                  </label>
                </div>
                <button type="button" className="text-sm text-cyan-500 hover:text-cyan-600 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Mot de passe oublié
                </button>
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('auth.login.submit')}
              </Button>

              {/* Register link */}
              <div className="text-center text-sm text-gray-600">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-cyan-500 hover:text-cyan-600"
                  disabled={isLoading}
                >
                  {t('auth.register.link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}