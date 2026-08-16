import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card className="shadow-lg border">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Invalid or Missing Token</h2>
          <p className="text-xs text-muted-foreground">
            The password reset link is invalid or expired.
          </p>
          <Link href="/login" className="text-xs text-primary underline block">
            Return to Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
