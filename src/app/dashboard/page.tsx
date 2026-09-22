import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import LogoutButton from '../components/LogoutButton';
type DashboardProps = {
  searchParams?: {
    role?: string;
  };
};

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = 'Super Admin';

  const farmers = [
    ['BF-0001', 'Islampur', 300, 218, 'Active'],
    ['BF-0002', 'Gosaidih', 300, 226, 'Active'],
    ['BF-0003', 'Kedli Kala', 300, 204, 'Active'],
    ['BF-0004', 'Jori', 500, 382, 'Active'],
  ];

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
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="stats">
            <div className="stat">
              <strong>300</strong>
              Farmers
            </div>

            <div className="stat">
              <strong>90,000</strong>
              Bird capacity
            </div>

            <div className="stat">
              <strong>63,500</strong>
              Demo eggs/day
            </div>

            <div className="stat">
              <strong>₹2.84L</strong>
              Demo sales
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3>Recent farmer activity</h3>

            <table className="table">
              <thead>
                <tr>
                  <th>Farmer ID</th>
                  <th>Village</th>
                  <th>Birds</th>
                  <th>Eggs today</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer[0]}>
                    <td>{farmer[0]}</td>
                    <td>{farmer[1]}</td>
                    <td>{farmer[2]}</td>
                    <td>{farmer[3]}</td>
                    <td>
                      <span className="badge">{farmer[4]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
