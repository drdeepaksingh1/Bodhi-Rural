'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type SellerNotification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  order_id: string | null;
  seller_order_id: string | null;
  is_read: boolean;
  created_at: string;
};

function readable(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SellerNotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [shopName, setShopName] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fnotifications');
        return;
      }
      setUserId(user.id);

      const { data: seller, error: sellerError } = await supabase
        .from('marketplace_sellers')
        .select('shop_name, status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (sellerError) throw sellerError;
      if (!seller) {
        setError('There is no seller account linked to this sign-in.');
        setNotifications([]);
        return;
      }
      if (seller.status !== 'ACTIVE') {
        setError('This seller account is not active. Contact BodhiMart administration for help.');
        setNotifications([]);
        return;
      }
      setShopName(seller.shop_name);

      const { data, error: notificationError } = await supabase
        .from('marketplace_notifications')
        .select('id, notification_type, title, message, order_id, seller_order_id, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (notificationError) throw notificationError;
      setNotifications((data || []) as SellerNotification[]);
    } catch (cause) {
      console.error('Unable to load seller notifications.', cause);
      setError('Notifications could not be loaded. Refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
        void Promise.resolve().then(loadNotifications);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  async function markRead(notificationId: string) {
    if (!userId) return;
    setUpdatingId(notificationId);
    setError('');
    setNotice('');
    try {
      const { data, error: updateError } = await supabase
        .from('marketplace_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error('This notification could not be updated. Refresh and try again.');
      setNotifications((current) => current.map((notification) =>
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      ));
    } catch (cause) {
      console.error('Unable to mark seller notification as read.', cause);
      setError(cause instanceof Error ? cause.message : 'This notification could not be updated.');
    } finally {
      setUpdatingId('');
    }
  }

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;
    setMarkingAll(true);
    setError('');
    setNotice('');
    try {
      const { error: updateError } = await supabase
        .from('marketplace_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (updateError) throw updateError;
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setNotice('All notifications are marked as read.');
    } catch (cause) {
      console.error('Unable to mark seller notifications as read.', cause);
      setError('Notifications could not be updated. Refresh and try again.');
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f5] px-4 py-8 text-[#183426] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link className="font-semibold text-green-800 hover:underline" href="/bodhimart/seller/dashboard">Seller dashboard</Link>
          <span aria-hidden="true">/</span><span>Notifications</span>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-green-950 p-6 text-white shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">BodhiMart seller center</p>
            <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
            <p className="mt-2 text-sm text-green-100">{shopName || 'Order and marketplace updates for your shop.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadNotifications()} disabled={loading || markingAll} className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60">
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" onClick={() => void markAllRead()} disabled={loading || markingAll || unreadCount === 0} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-green-950 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60">
              {markingAll ? 'Updating…' : `Mark all read${unreadCount ? ` (${unreadCount})` : ''}`}
            </button>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600" aria-live="polite">
            {loading ? 'Loading notifications…' : `${notifications.length} notification${notifications.length === 1 ? '' : 's'} · ${unreadCount} unread`}
          </p>
          <Link className="text-sm font-bold text-green-800 hover:underline" href="/bodhimart/seller/orders">View seller orders →</Link>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900" role="status">{notice}</p>}

        {loading ? (
          <section className="mt-5 rounded-2xl bg-white p-10 text-center text-gray-600 shadow-sm" aria-live="polite">Loading your notifications…</section>
        ) : error && !userId ? null : notifications.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
            <span className="text-4xl" aria-hidden="true">🔔</span>
            <h2 className="mt-3 text-xl font-bold text-gray-900">You’re all caught up</h2>
            <p className="mt-2 text-sm text-gray-600">Order updates for {shopName || 'your shop'} will appear here.</p>
            <Link className="mt-5 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900" href="/bodhimart/seller/orders">View orders</Link>
          </section>
        ) : (
          <section className="mt-5 space-y-3" aria-label="Seller notifications">
            {notifications.map((notification) => (
              <article key={notification.id} className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${notification.is_read ? 'border-gray-200' : 'border-green-300 ring-1 ring-green-100'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${notification.is_read ? 'bg-gray-300' : 'bg-green-700'}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-950">{notification.title}</h2>
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-900">{readable(notification.notification_type)}</span>
                        {!notification.is_read && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">Unread</span>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-700">{notification.message}</p>
                      <time className="mt-2 block text-xs text-gray-500" dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                    </div>
                  </div>
                  <div className="ml-6 flex shrink-0 flex-wrap gap-2">
                                        {notification.seller_order_id && <Link className="rounded-lg border border-green-700 px-3 py-2 text-xs font-bold text-green-900 hover:bg-green-50" href={`/bodhimart/seller/orders?search=${encodeURIComponent(notification.seller_order_id)}`}>Open order details</Link>}
                    {!notification.is_read && <button type="button" onClick={() => void markRead(notification.id)} disabled={updatingId !== '' || markingAll} className="rounded-lg bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-900 disabled:cursor-wait disabled:opacity-60">{updatingId === notification.id ? 'Saving…' : 'Mark as read'}</button>}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="mt-6 flex flex-wrap gap-3">
          <Link href="/bodhimart/seller/dashboard" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Back to dashboard</Link>
          <Link href="/bodhimart/seller/orders" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Seller orders</Link>
        </footer>
      </div>
    </main>
  );
}
