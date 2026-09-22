import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import LogoutButton from '../components/LogoutButton';

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = 'Super Admin';

  const {
    count: farmerCount,
    error: farmerCountError,
  } = await supabase
    .from('farmers')
    .select('*', {
      count: 'exact',
      head: true,
    });

  const totalFarmers = farmerCountError ? 0 : (farmerCount ?? 0);

  const {
    data: recentFarmers,
    error: recentFarmersError,
  } = await supabase
    .from('farmers')
    .select('farmer_id, full_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <main className="dashboard">
      <div className="dashhead">
        <div className="container">
          <div className="brand">
            BODHI <span>RURAL</span>
          </div>

          <h2>{role} Dashboard</h2>

          <div className="dashnav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/bodhifarm">BodhiFarm</Link>
            <Link href="/bodhimart">BodhiMart</Link>
            <Link href="/farmer-network">Farmers</Link>
            <Link href="/">Website</Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">

          <div className="stats">
            <div className="stat">
              <strong>{totalFarmers}</strong>
              <span>Farmers</span>
            </div>

            <div className="stat">
              <strong>90,000</strong>
              <span>Bird Capacity</span>
            </div>

            <div className="stat">
              <strong>63,500</strong>
              <span>Demo Eggs / Day</span>
            </div>

            <div className="stat">
              <strong>₹2.84L</strong>
              <span>Demo Sales</span>
            </div>
          </div>

          <div className="card">
            <h3>Recent Farmers</h3>

            <div className="table-wrap">

              {recentFarmersError ? (
                <p>Unable to load farmer records.</p>
              ) : recentFarmers && recentFarmers.length > 0 ? (

                <table>
                  <thead>
                    <tr>
                      <th>Farmer ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentFarmers.map((farmer) => (
                      <tr key={farmer.farmer_id}>
                        <td>{farmer.farmer_id}</td>
                        <td>{farmer.full_name}</td>
                        <td>{farmer.status}</td>
                        <td>
                          {farmer.created_at
                            ? new Date(
                                farmer.created_at
                              ).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              ) : (
                <p>No farmers found.</p>
              )}

            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
