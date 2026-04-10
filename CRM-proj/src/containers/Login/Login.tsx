import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/useAuth';
import { defaultRouteByRole } from '../../app/navigation';
import type { UserRole } from '../../types';
import './Login.css';

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

const roleText: Record<UserRole, { label: string; hint: string; pinLength: number }> = {
  FLORIST: {
    label: 'Флорист',
    hint: 'Введите 4-значный PIN-код',
    pinLength: 4,
  },
  ADMIN: {
    label: 'Администратор',
    hint: 'Введите 8-значный PIN-код',
    pinLength: 8,
  },
};

const roleOptions = ['FLORIST', 'ADMIN'] as UserRole[];
const keypadDigits = keypadRows.flat();

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.error ?? 'Не удалось выполнить вход.';
  }

  return 'Не удалось выполнить вход.';
};

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M13.999 5.83293C13.999 5.14074 14.2043 4.4641 14.5888 3.88857C14.9734 3.31303 15.52 2.86446 16.1595 2.59957C16.799 2.33468 17.5027 2.26538 18.1815 2.40042C18.8604 2.53546 19.484 2.86877 19.9735 3.35822C20.4629 3.84767 20.7963 4.47127 20.9313 5.15016C21.0663 5.82904 20.997 6.53273 20.7321 7.17222C20.4672 7.81172 20.0187 8.35831 19.4431 8.74287C18.8676 9.12742 18.191 9.33268 17.4988 9.33268M13.999 5.83293C13.999 5.14074 13.7938 4.4641 13.4092 3.88857C13.0247 3.31303 12.4781 2.86446 11.8386 2.59957C11.1991 2.33468 10.4954 2.26538 9.8165 2.40042C9.13761 2.53546 8.51402 2.86877 8.02457 3.35822C7.53512 3.84767 7.2018 4.47127 7.06676 5.15016C6.93172 5.82904 7.00103 6.53273 7.26592 7.17222C7.5308 7.81172 7.97938 8.35831 8.55491 8.74287C9.13044 9.12742 9.80708 9.33268 10.4993 9.33268M13.999 5.83293V6.99951M17.4988 9.33268C18.191 9.33268 18.8676 9.53794 19.4431 9.9225C20.0187 10.3071 20.4672 10.8536 20.7321 11.4931C20.997 12.1326 21.0663 12.8363 20.9313 13.5152C20.7963 14.1941 20.4629 14.8177 19.9735 15.3071C19.484 15.7966 18.8604 16.1299 18.1815 16.2649C17.5027 16.4 16.799 16.3307 16.1595 16.0658C15.52 15.8009 14.9734 15.3523 14.5888 14.7768C14.2043 14.2013 13.999 13.5246 13.999 12.8324M17.4988 9.33268H16.3322M10.4993 9.33268C9.80708 9.33268 9.13044 9.53794 8.55491 9.9225C7.97938 10.3071 7.5308 10.8536 7.26592 11.4931C7.00103 12.1326 6.93172 12.8363 7.06676 13.5152C7.2018 14.1941 7.53512 14.8177 8.02457 15.3071C8.51402 15.7966 9.13761 16.1299 9.8165 16.2649C10.4954 16.4 11.1991 16.3307 11.8386 16.0658C12.4781 15.8009 13.0247 15.3523 13.4092 14.7768C13.7938 14.2013 13.999 13.5246 13.999 12.8324M10.4993 9.33268H11.6659M13.999 12.8324V11.6659" stroke="white" strokeWidth="2.33317" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.999 11.6659C15.2876 11.6659 16.3322 10.6213 16.3322 9.33268C16.3322 8.04411 15.2876 6.99951 13.999 6.99951C12.7104 6.99951 11.6658 8.04411 11.6658 9.33268C11.6658 10.6213 12.7104 11.6659 13.999 11.6659Z" stroke="white" strokeWidth="2.33317" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.999 11.6659V25.6649" stroke="white" strokeWidth="2.33317" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.999 25.6649C18.8987 25.6649 22.1651 23.7202 22.1651 19.8319C17.2655 19.8319 13.999 21.7766 13.999 25.6649Z" stroke="white" strokeWidth="2.33317" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.999 25.6649C9.09939 25.6649 5.83295 23.7202 5.83295 19.8319C10.7326 19.8319 13.999 21.7766 13.999 25.6649Z" stroke="white" strokeWidth="2.33317" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FloristIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M5.95553 9.66447C5.89602 9.43381 5.7758 9.22332 5.60736 9.05488C5.43892 8.88644 5.22842 8.76621 4.99776 8.70671L0.908762 7.6523C0.838999 7.6325 0.7776 7.59048 0.733879 7.53262C0.690159 7.47477 0.666504 7.40423 0.666504 7.33171C0.666504 7.25919 0.690159 7.18865 0.733879 7.13079C0.7776 7.07294 0.838999 7.03092 0.908762 7.01112L4.99776 5.95605C5.22834 5.8966 5.43878 5.77647 5.60722 5.60816C5.77565 5.43984 5.89592 5.22948 5.95553 4.99895L7.00994 0.909944C7.02954 0.839907 7.07151 0.778204 7.12946 0.73425C7.1874 0.690296 7.25813 0.666504 7.33086 0.666504C7.40359 0.666504 7.47432 0.690296 7.53226 0.73425C7.59021 0.778204 7.63218 0.839907 7.65178 0.909944L8.70552 4.99895C8.76503 5.2296 8.88525 5.4401 9.05369 5.60854C9.22213 5.77698 9.43263 5.89721 9.66329 5.95671L13.7523 7.01045C13.8226 7.02985 13.8846 7.07178 13.9288 7.12981C13.973 7.18784 13.9969 7.25877 13.9969 7.33171C13.9969 7.40465 13.973 7.47558 13.9288 7.53361C13.8846 7.59164 13.8226 7.63357 13.7523 7.65296L9.66329 8.70671C9.43263 8.76621 9.22213 8.88644 9.05369 9.05488C8.88525 9.22332 8.76503 9.43381 8.70552 9.66447L7.65111 13.7535C7.63151 13.8235 7.58954 13.8852 7.5316 13.9292C7.47365 13.9731 7.40292 13.9969 7.33019 13.9969C7.25747 13.9969 7.18673 13.9731 7.12879 13.9292C7.07085 13.8852 7.02887 13.8235 7.00927 13.7535L5.95553 9.66447Z" stroke="currentColor" strokeWidth="1.33301" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M12.6636 13.9966V12.6636C12.6636 11.9565 12.3827 11.2784 11.8827 10.7784C11.3827 10.2784 10.7046 9.99756 9.99756 9.99756H5.99854C5.29146 9.99756 4.61335 10.2784 4.11338 10.7784C3.6134 11.2784 3.33252 11.9565 3.33252 12.6636V13.9966" stroke="currentColor" strokeWidth="1.33301" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.99805 7.33154C9.47045 7.33154 10.6641 6.13793 10.6641 4.66553C10.6641 3.19313 9.47045 1.99951 7.99805 1.99951C6.52565 1.99951 5.33203 3.19313 5.33203 4.66553C5.33203 6.13793 6.52565 7.33154 7.99805 7.33154Z" stroke="currentColor" strokeWidth="1.33301" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M7.1665 6.25049L10.8332 9.91715M10.8332 6.25049L7.1665 9.91715" stroke="#8B8CA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 9.83382L3.78083 12.7223C4.04585 13.0579 4.17837 13.2257 4.35042 13.3461C4.5028 13.4526 4.67268 13.5315 4.8523 13.5793C5.05515 13.6333 5.26899 13.6333 5.69667 13.6333H11.3292C12.0908 13.6333 12.4716 13.6333 12.765 13.4851C13.0231 13.3547 13.2333 13.1445 13.3637 12.8863C13.5119 12.5929 13.5119 12.2122 13.5119 11.4506V6.54932C13.5119 5.78775 13.5119 5.40696 13.3637 5.11356C13.2333 4.85545 13.0231 4.64524 12.765 4.51478C12.4716 4.36662 12.0908 4.36662 11.3292 4.36662H5.69667C5.26899 4.36662 5.05515 4.36662 4.8523 4.42057C4.67268 4.46833 4.5028 4.54727 4.35042 4.65376C4.17837 4.77412 4.04585 4.94191 3.78083 5.27749L1.5 8.16599C1.27348 8.45288 1.16022 8.59632 1.11665 8.75446C1.07823 8.89391 1.07823 9.10589 1.11665 9.24534C1.16022 9.40348 1.27348 9.54693 1.5 9.83382Z" stroke="#8B8CA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('FLORIST');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const roleConfig = roleText[selectedRole];
  const roleThemeClass = selectedRole === 'FLORIST' ? 'auth-role-florist' : 'auth-role-admin';

  const pinIndicators = useMemo(
    () => Array.from({ length: roleConfig.pinLength }, (_, index) => index < pin.length),
    [pin.length, roleConfig.pinLength],
  );

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPin('');
    setErrorMessage('');
  };

  const appendDigit = (digit: string) => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setPin((currentPin) => {
      if (currentPin.length >= roleConfig.pinLength) {
        return currentPin;
      }

      return `${currentPin}${digit}`;
    });
  };

  const handleDelete = () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setPin((currentPin) => currentPin.slice(0, -1));
  };

  const handleReset = () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length !== roleConfig.pinLength) {
      setErrorMessage(`Для роли "${roleConfig.label}" нужен PIN ровно из ${roleConfig.pinLength} символов.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const session = await signIn(pin);
      navigate(defaultRouteByRole[session.user.role], { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyboardInput = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      appendDigit(event.key);
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      handleDelete();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleReset();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
    }
  });

  const submitCompletedPin = useEffectEvent(() => {
    void handleSubmit();
  });

  useEffect(() => {
    if (!isSubmitting && pin.length === roleConfig.pinLength) {
      submitCompletedPin();
    }
  }, [pin.length, roleConfig.pinLength, isSubmitting]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardInput);

    return () => {
      window.removeEventListener('keydown', handleKeyboardInput);
    };
  }, []);

  return (
    <div className={`auth-page ${roleThemeClass}`}>
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />
      <div className="auth-blur auth-blur-top" />
      <div className="auth-blur auth-blur-bottom" />

      <section className="auth-panel" aria-label="Авторизация">
        <div className="auth-brand">
          <div className="auth-logo">
            <LogoIcon />
          </div>
          <h1 className="auth-title">Flora CRM</h1>
          <p className="auth-subtitle">Премиальная система для флористов</p>
        </div>

        <div className="auth-card">
          <div className="auth-switch">
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                className={
                  role === selectedRole
                    ? `auth-switch-btn auth-switch-btn-active ${role === 'FLORIST' ? 'auth-switch-btn-florist-active' : 'auth-switch-btn-admin-active'}`
                    : 'auth-switch-btn'
                }
                onClick={() => selectRole(role)}
              >
                <span className="auth-switch-icon">{role === 'FLORIST' ? <FloristIcon /> : <AdminIcon />}</span>
                <span>{roleText[role].label}</span>
              </button>
            ))}
          </div>

          <p className="auth-hint">{roleConfig.hint}</p>

          <div className="auth-dots" aria-label="PIN code status">
            {pinIndicators.map((isFilled, index) => (
              <span
                key={`${selectedRole}-${index}`}
                className={isFilled ? 'auth-dot auth-dot-filled' : 'auth-dot'}
              />
            ))}
          </div>

          <div className="auth-keypad">
            {keypadDigits.map((digit) => (
              <button
                key={digit}
                type="button"
                className="auth-key"
                onClick={() => appendDigit(digit)}
                disabled={isSubmitting}
              >
                {digit}
              </button>
            ))}

            <button type="button" className="auth-key auth-key-secondary" onClick={handleReset} disabled={isSubmitting}>
              Сброс
            </button>
            <button type="button" className="auth-key auth-key-zero" onClick={() => appendDigit('0')} disabled={isSubmitting}>
              0
            </button>
            <button type="button" className="auth-key auth-key-secondary auth-key-icon" onClick={handleDelete} disabled={isSubmitting} aria-label="Удалить символ">
              <DeleteIcon />
            </button>
          </div>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        </div>
      </section>
    </div>
  );
};

export default Login;
