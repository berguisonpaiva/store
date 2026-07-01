import { LoginForm } from './login-form';

/**
 * Rota de login (`/join`). O formulário é um client component; a submissão
 * passa por uma Server Action que envolve `signIn('credentials')`.
 */
export default function AuthPage() {
  return <LoginForm />;
}
