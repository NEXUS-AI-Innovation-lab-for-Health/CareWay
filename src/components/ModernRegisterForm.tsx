import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface ModernRegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export function ModernRegisterForm({ onRegisterSuccess, onSwitchToLogin, onBack }: ModernRegisterFormProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!firstName) {
      setFirstNameError(t('auth.error.firstname_required'));
      hasError = true;
    }

    if (!lastName) {
      setLastNameError(t('auth.error.lastname_required'));
      hasError = true;
    }

    if (!email) {
      setEmailError(t('auth.error.email_invalid'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth.error.password_required'));
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(t('auth.error.password_length'));
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('auth.error.password_confirm_required'));
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.error.password_mismatch'));
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      console.log('Attempting patient registration for:', email);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/api/patient/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ firstName, lastName, email, password, phone, address })
      });

      console.log('Patient registration response status:', response.status);
      
      const data = await response.json();
      console.log('Patient registration response data:', data);

      if (response.ok && data.success) {
        console.log('Registration successful');
        console.log('✅ Patient créé avec l\'ID:', data.userId);
        setSuccess(true);
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      } else {
        const errorMsg = data.error || 'Erreur lors de l\'inscription';
        console.error('Patient registration error:', errorMsg);
        setEmailError(errorMsg);
      }
    } catch (error) {
      console.error('Patient registration network error:', error);
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
              <h1 className="text-gray-900 mb-2">{t('auth.register.title')}</h1>
              <p className="text-sm text-gray-600">{t('auth.register.desc')}</p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {t('auth.success.register')}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name field */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm text-gray-700">
                  Prénom
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setFirstNameError('');
                  }}
                  className={firstNameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {firstNameError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{firstNameError}</span>
                  </div>
                )}
              </div>

              {/* Last Name field */}
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm text-gray-700">
                  Nom
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setLastNameError('');
                  }}
                  className={lastNameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {lastNameError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{lastNameError}</span>
                  </div>
                )}
              </div>

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

              {/* Phone field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm text-gray-700">
                  {t('profile.phone')} (optionnel)
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={isLoading}
                />
              </div>

              {/* Address field */}
              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm text-gray-700">
                  {t('profile.address')} (optionnel)
                </label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 Rue de la République, 75001 Paris"
                  disabled={isLoading}
                />
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

              {/* Confirm Password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError('');
                    }}
                    className={`pr-10 ${confirmPasswordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? t('common.saving') : t('auth.register.submit')}
              </Button>

              {/* Login link */}
              <div className="text-center text-sm text-gray-600">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-cyan-500 hover:text-cyan-600"
                  disabled={isLoading}
                >
                  {t('auth.login.link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}