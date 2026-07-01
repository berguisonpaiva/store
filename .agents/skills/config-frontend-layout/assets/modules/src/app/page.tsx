import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    if (session.status === 'INACTIVE') {
      redirect('/login?reason=inactive');
    }
    redirect('/home');
  }
  redirect('/login');
}
