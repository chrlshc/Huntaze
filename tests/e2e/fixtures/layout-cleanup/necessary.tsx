
    import { useSession } from 'next-auth/react';
    
    export default function Layout({ children }: { children: React.ReactNode }) {
      const session = useSession();
      return <div className="protected">{children}</div>;
    }
  