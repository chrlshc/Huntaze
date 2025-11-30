import { Card } from '@/components/ui/card';
export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <main className="hz-main" role="main">
      <div className="hz-page">
        <h1>Account</h1>
        <p>Manage your profile, team, and security settings here.</p>
        <Card style={{ marginTop: 16 }}>
          <h2>Profile</h2>
          <p>Coming soon.</p>
        </Card>
      </div>
    </main>
  );
}
