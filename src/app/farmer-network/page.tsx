import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rural Network',
  description: 'A digital workspace for rural operations, information and regional programme coordination.',
  alternates: { canonical: '/farmer-network' },
};

export default function Page(){return <><main className="section"><div className="container"><h1>Rural Network</h1><p className="muted">An integrated digital workspace for rural operations, information and regional programme coordination.</p><div className="grid"><div className="card"><h3>Operations</h3><p className="muted">Track activities, users and records through role-based dashboards.</p></div><div className="card"><h3>Reports</h3><p className="muted">Prepare filtered management information across state, district, block, cluster and programme.</p></div><div className="card"><h3>Scale</h3><p className="muted">Designed to support phased programmes and future expansion.</p></div></div></div></main></>}
