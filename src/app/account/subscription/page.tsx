'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getUserBenefits } from '@/lib/subscription';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { useRouter } from 'next/navigation';

interface SubscriptionData {
  tier: string;
  status: string;
  endDate: string | null;
  aiMasteringCredits: number;
  promotionalCredits: number;
  vinylSalesCount: number;
  successfulPresalesCount: number;
  digitalDownloadsCount: number;
  digitalDownloadSales: number;
  digitalDownloadSalesPaid: number;
  presaleEarnings?: number;
  presaleEarningsPaid: number;
}

interface Order {
  id: string;
  format: string;
  quantity: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  nft: {
    id: string;
    name: string;
  };
}

const UPGRADE_TIERS = [
  { key: 'starter', label: 'Starter (Default)', price: '£30', isDefault: true },
  { key: 'plus', label: 'Upgrade to Plus', price: '£145', isDefault: false },
  { key: 'gold', label: 'Upgrade to Gold', price: '£199', isDefault: false },
];

export default function SubscriptionDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    setUpgradeLoading(tier);
    try {
      const res = await fetch('/api/upgrade-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start upgrade payment.');
      }
    } catch (err) {
      alert('Failed to start upgrade payment.');
    } finally {
      setUpgradeLoading(null);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();
        if (data.success && data.subscription) {
          setSubscription({
            tier: data.subscription.subscriptionTier,
            status: data.subscription.subscriptionStatus,
            endDate: data.subscription.subscriptionEndDate,
            aiMasteringCredits: data.subscription.aiMasteringCredits,
            promotionalCredits: data.subscription.promotionalCredits,
            vinylSalesCount: data.subscription.vinylSalesCount,
            successfulPresalesCount: data.subscription.successfulPresalesCount,
            digitalDownloadsCount: data.subscription.digitalDownloadsCount,
            digitalDownloadSales: data.subscription.digitalDownloadSales,
            digitalDownloadSalesPaid: data.subscription.digitalDownloadSalesPaid,
            presaleEarnings: data.subscription.presaleEarnings,
            presaleEarningsPaid: data.subscription.presaleEarningsPaid,
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (session?.user) {
      fetchSubscription();
      fetchOrders();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold mb-8">Subscription Dashboard</h1>
      
      {/* Current Plan */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Current Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-neutral-500">Subscription Tier</p>
            <p className="text-xl font-medium capitalize">{subscription?.tier || 'No active subscription'}</p>
            {(subscription?.tier === 'plus' || subscription?.tier === 'gold') && (
              <p className="mt-2 text-green-600 font-semibold">Livestream to your fans (Go Live Expo) is included in your plan!</p>
            )}
          </div>
          <div>
            <p className="text-neutral-500">Status</p>
            <p className="text-xl font-medium capitalize">{subscription?.status || 'N/A'}</p>
          </div>
          {subscription?.endDate && (
            <div>
              <p className="text-neutral-500">Renewal Date</p>
              <p className="text-xl font-medium">
                {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* My Purchases Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">My Purchases</h2>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 mb-4">You haven't made any purchases yet.</p>
            <ButtonPrimary onClick={() => router.push('/collection')}>
              Browse Collection
            </ButtonPrimary>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.nft.name || 'Unknown Title'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.format === 'vinyl' && order.status === 'pending'
                          ? 'Pending Threshold Completion'
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <span>Format: {order.format.charAt(0).toUpperCase() + order.format.slice(1)}</span>
                      <span>Quantity: {order.quantity}</span>
                      <span>Total: £{order.totalPrice.toFixed(2)}</span>
                      <span>Ordered: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {(order.format === 'digital' && 
                    (['completed', 'processing'].includes(order.status)) &&
                    (['processed', 'captured', 'completed'].includes(order.paymentStatus))) && (
                    <ButtonPrimary
                      className="text-sm px-3 py-1"
                      onClick={() => router.push(`/downloads`)}
                    >
                      Download
                    </ButtonPrimary>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Benefits Overview */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Plan Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analytics Access */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 flex-shrink-0 ${subscription?.tier === 'gold' ? 'text-yellow-500' : 'text-green-500'}`}>
              ✓
            </div>
            <div className="flex-grow">
              <h3 className="font-medium">Analytics Dashboard</h3>
              <p className="text-sm text-neutral-500 mb-2">
                {subscription?.tier === 'gold' 
                  ? 'Full analytics with views, player counts, buyer locations & demographics' 
                  : 'Basic analytics with views, sales, and revenue data'
                }
              </p>
              <ButtonPrimary
                className="text-sm px-4 py-2"
                onClick={() => router.push('/analytics')}
              >
                View Analytics
              </ButtonPrimary>
              {subscription?.tier !== 'gold' && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Upgrade to Gold for full analytics including buyer locations, player counts, and demographics
                </p>
              )}
            </div>
          </div>

          {/* Premium Placement */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 flex-shrink-0 ${['starter','basic'].includes(subscription?.tier || '') ? 'text-neutral-400' : 'text-green-500'}`}>
              {['starter','basic'].includes(subscription?.tier || '') ? '✗' : '✓'}
            </div>
            <div>
              <h3 className="font-medium">Premium Display Placement</h3>
              <p className="text-sm text-neutral-500">
                {['starter','basic'].includes(subscription?.tier || '') ? 'Standard placement' : 'Priority placement in listings'}
              </p>
            </div>
          </div>

          {/* Promotional Strategy */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 flex-shrink-0 ${subscription?.tier === 'plus' ? 'text-green-500' : 'text-neutral-400'}`}>
              {subscription?.tier === 'plus' ? '✓' : '✗'}
            </div>
            <div>
              <h3 className="font-medium">Promotional Strategy</h3>
              <p className="text-sm text-neutral-500">
                {subscription?.tier === 'plus' ? '1-1 strategy meeting available' : 'Upgrade to Plus for strategy support'}
              </p>
            </div>
          </div>

          {/* Upload Limits */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 flex-shrink-0 ${subscription?.tier === 'plus' || subscription?.tier === 'gold' ? 'text-green-500' : 'text-neutral-400'}`}>
              {(subscription?.tier === 'plus' || subscription?.tier === 'gold') ? '✓' : '✗'}
            </div>
            <div>
              <h3 className="font-medium">Unlimited Uploads</h3>
              <p className="text-sm text-neutral-500">
                {(subscription?.tier === 'plus' || subscription?.tier === 'gold')
                  ? 'Unlimited presale uploads included'
                  : 'Pay-as-you-go uploads (£30 each) or upgrade to Plus/Gold for unlimited'}
              </p>
            </div>
          </div>

          {/* Digital Downloads */}
          <div className="flex items-start space-x-3">
            <div className="mt-1 flex-shrink-0 text-green-500">✓</div>
            <div className="flex-grow">
              <h3 className="font-medium">Digital Downloads</h3>
              <p className="text-sm text-neutral-500 mb-2">
                Access your purchased digital tracks
              </p>
              <ButtonPrimary
                className="text-sm px-4 py-2"
                onClick={() => router.push('/downloads')}
              >
                View Downloads
              </ButtonPrimary>
            </div>
          </div>

          {/* AI Digital Mastering */}
          <div className="flex items-start space-x-3">
            <div className="mt-1 flex-shrink-0 text-green-500">✓</div>
            <div className="flex-grow">
              <h3 className="font-medium">AI Digital Mastering</h3>
              <p className="text-sm text-neutral-500 mb-2">
                Professional AI mastering for your tracks
              </p>
              <div className="flex gap-2">
                <ButtonPrimary
                  className="text-sm px-4 py-2"
                  onClick={() => router.push('/mastering-upload')}
                >
                  Upload Track
                </ButtonPrimary>
                <MasteredTracksButton />
              </div>
            </div>
          </div>

          {/* Livestreaming Feature */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 flex-shrink-0 ${subscription?.tier === 'plus' || subscription?.tier === 'gold' ? 'text-green-500' : 'text-neutral-400'}`}>
              {(subscription?.tier === 'plus' || subscription?.tier === 'gold') ? '✓' : '✗'}
            </div>
            <div>
              <h3 className="font-medium">Livestream to your fans (Go Live Expo)</h3>
              <p className="text-sm text-neutral-500">
                {subscription?.tier === 'plus' || subscription?.tier === 'gold'
                  ? 'Go live and interact with your audience in real-time.'
                  : 'Upgrade to Plus or Gold to unlock livestreaming.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">AI Mastering Credits</h3>
          <p className="text-3xl font-bold text-primary-500">{subscription?.aiMasteringCredits ?? 0}</p>
          <p className="text-neutral-500 mt-2">Remaining credits</p>
          {/* AI Mastering Credits Buttons */}
          {subscription?.tier === 'plus' ? (
            <>
              <ButtonPrimary
                className="mt-4"
                onClick={() => router.push('/mastering-upload')}
              >
                Go to Mastering Upload
              </ButtonPrimary>
              {/* Mastered Tracks List Section */}
              <MasteredTracksList />
            </>
          ) : (
            (subscription?.aiMasteringCredits ?? 0) > 0 && (
              <ButtonPrimary
                className="mt-4"
                onClick={() => router.push('/mastering-upload')}
              >
                Go to Mastering Upload
              </ButtonPrimary>
            )
          )}
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Promotional Credits</h3>
          <p className="text-3xl font-bold text-primary-500">£{subscription?.promotionalCredits ?? 0}</p>
          <p className="text-neutral-500 mt-2">Available for promotion</p>
          {(subscription?.promotionalCredits ?? 0) > 0 && (
            <ButtonPrimary
              className="mt-4"
              onClick={() => router.push('/contact')}
            >
              Contact Us
            </ButtonPrimary>
          )}
        </div>
      </div>

      {/* Royalties and Sales Info Box */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-8">
        <h4 className="text-lg font-semibold mb-6">Royalties and Sales</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="block font-medium mb-1">Albums ordered by Fans</span>
            <span className="text-2xl">{subscription?.vinylSalesCount ?? 0}</span>
          </div>
          <div>
            <span className="block font-medium mb-1">Successful Presales</span>
            <span className="text-2xl">{subscription?.successfulPresalesCount ?? 0}</span>
            <div className="text-sm text-neutral-500 mt-2">Presale Earnings: £{(subscription?.presaleEarnings ?? 0).toFixed(2)}</div>
            <div className="text-sm text-neutral-500 mt-2">Paid to Date: £{(subscription?.presaleEarningsPaid ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <span className="block font-medium mb-1">Digital Downloads</span>
            <span className="text-2xl">{subscription?.digitalDownloadsCount ?? 0}</span>
          </div>
          <div>
            <span className="block font-medium mb-1">Digital Download Sales</span>
            <span className="text-2xl">£{(subscription?.digitalDownloadSales ?? 0).toFixed(2)}</span>
            <div className="text-sm text-neutral-500 mt-2">Paid to Date: £{(subscription?.digitalDownloadSalesPaid ?? 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="text-center mt-8 space-x-4">
        {UPGRADE_TIERS.map(tier =>
          tier.isDefault ? (
            <span
              key={tier.key}
              className="min-w-[200px] inline-block bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold cursor-default"
            >
              {tier.label}
            </span>
          ) : (
            <button
              key={tier.key}
              className="min-w-[200px] bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleUpgrade(tier.key)}
              disabled={!!upgradeLoading}
            >
              {upgradeLoading === tier.key ? 'Redirecting...' : `${tier.label} (${tier.price})`}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// Add MasteredTracksButton component for the benefits section
function MasteredTracksButton() {
  const [hasCompletedTracks, setHasCompletedTracks] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/mastering-request')
      .then(res => res.json())
      .then(data => {
        const completed = (data.requests || []).filter(
          (req: any) => req.status === 'completed' && req.masteredTrackUrl
        );
        setHasCompletedTracks(completed.length > 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-neutral-400">Loading...</div>;
  
  if (!hasCompletedTracks) {
    return <div className="text-xs text-neutral-400">No completed tracks yet</div>;
  }

  return (
    <ButtonPrimary
      className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700"
      onClick={() => router.push('/mastered-tracks')}
    >
      View Mastered Tracks
    </ButtonPrimary>
  );
}

// Add MasteredTracksList component
function MasteredTracksList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mastering-request')
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const completed = requests.filter(
    (req) => req.status === 'completed' && req.masteredTrackUrl
  );

  if (loading) return <div>Loading mastered tracks...</div>;
  if (completed.length === 0) return <div className="text-neutral-500 mt-4">No mastered tracks available yet.</div>;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Mastered Tracks Available</h3>
      <ul className="space-y-2">
        {completed.map((req) => (
          <li key={req.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-medium">{new Date(req.createdAt).toLocaleDateString()}</span>
              <span className="ml-2 text-sm text-green-600">Mastered</span>
            </div>
            <div className="mt-2 md:mt-0 flex gap-2">
              <a
                href={req.masteredTrackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline text-sm"
              >
                Download Mastered
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 