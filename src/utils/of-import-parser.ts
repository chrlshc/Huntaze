import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';

export interface OFTransaction {
  date: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  subscriberId?: string;
  postId?: string;
}

export interface OFEarning {
  date: string;
  earnings: number;
  tips: number;
  ppv: number;
  subscriptions: number;
  referrals: number;
  currency: string;
}

export interface OFSubscriber {
  userId: string;
  username: string;
  subscribedDate: string;
  expiryDate?: string;
  price: number;
  autoRenew: boolean;
  lifetime: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

export interface OFPost {
  postId: string;
  createdAt: string;
  type: 'photo' | 'video' | 'text' | 'audio';
  likes: number;
  comments: number;
  tips: number;
  ppvRevenue: number;
  totalRevenue: number;
  mediaCount: number;
}

export interface OFImportResult {
  transactions: OFTransaction[];
  earnings: OFEarning[];
  subscribers: OFSubscriber[];
  posts: OFPost[];
  summary: {
    totalTransactions: number;
    totalEarnings: number;
    totalSubscribers: number;
    totalPosts: number;
    dateRange: { start: string; end: string };
  };
}

export async function parseOnlyFansZip(zipBuffer: ArrayBuffer): Promise<OFImportResult> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const result: OFImportResult = {
    transactions: [],
    earnings: [],
    subscribers: [],
    posts: [],
    summary: {
      totalTransactions: 0,
      totalEarnings: 0,
      totalSubscribers: 0,
      totalPosts: 0,
      dateRange: { start: '', end: '' }
    }
  };

  const dateSet = new Set<string>();

  // Parse transactions CSV
  const transactionsFile = Object.keys(zip.files).find(name => 
    name.toLowerCase().includes('transaction') && name.endsWith('.csv')
  );
  
  if (transactionsFile) {
    const content = await zip.files[transactionsFile].async('text');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    result.transactions = records.map((row: any) => {
      const date = row['Date'] || row['date'] || '';
      dateSet.add(date);
      
      return {
        date,
        type: row['Type'] || row['type'] || 'unknown',
        amount: parseFloat(row['Amount'] || row['amount'] || '0'),
        currency: row['Currency'] || row['currency'] || 'USD',
        description: row['Description'] || row['description'] || '',
        subscriberId: row['User ID'] || row['user_id'] || undefined,
        postId: row['Post ID'] || row['post_id'] || undefined
      };
    });
  }

  // Parse earnings CSV
  const earningsFile = Object.keys(zip.files).find(name => 
    name.toLowerCase().includes('earning') && name.endsWith('.csv')
  );
  
  if (earningsFile) {
    const content = await zip.files[earningsFile].async('text');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    result.earnings = records.map((row: any) => {
      const date = row['Date'] || row['date'] || '';
      dateSet.add(date);
      
      return {
        date,
        earnings: parseFloat(row['Total Earnings'] || row['total_earnings'] || '0'),
        tips: parseFloat(row['Tips'] || row['tips'] || '0'),
        ppv: parseFloat(row['PPV'] || row['ppv'] || '0'),
        subscriptions: parseFloat(row['Subscriptions'] || row['subscriptions'] || '0'),
        referrals: parseFloat(row['Referrals'] || row['referrals'] || '0'),
        currency: row['Currency'] || row['currency'] || 'USD'
      };
    });
  }

  // Parse subscribers CSV
  const subscribersFile = Object.keys(zip.files).find(name => 
    name.toLowerCase().includes('subscriber') && name.endsWith('.csv')
  );
  
  if (subscribersFile) {
    const content = await zip.files[subscribersFile].async('text');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    result.subscribers = records.map((row: any) => {
      const subscribedDate = row['Subscribed Date'] || row['subscribed_date'] || '';
      const expiryDate = row['Expiry Date'] || row['expiry_date'] || '';
      dateSet.add(subscribedDate);
      
      return {
        userId: row['User ID'] || row['user_id'] || '',
        username: row['Username'] || row['username'] || '',
        subscribedDate,
        expiryDate: expiryDate || undefined,
        price: parseFloat(row['Price'] || row['price'] || '0'),
        autoRenew: row['Auto Renew'] === 'true' || row['auto_renew'] === 'true',
        lifetime: row['Lifetime'] === 'true' || row['lifetime'] === 'true',
        status: determineSubscriptionStatus(expiryDate)
      };
    });
  }

  // Parse posts/content CSV if available
  const postsFile = Object.keys(zip.files).find(name => 
    (name.toLowerCase().includes('post') || name.toLowerCase().includes('content')) && name.endsWith('.csv')
  );
  
  if (postsFile) {
    const content = await zip.files[postsFile].async('text');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    result.posts = records.map((row: any) => {
      const createdAt = row['Created At'] || row['created_at'] || row['Date'] || '';
      dateSet.add(createdAt);
      
      return {
        postId: row['Post ID'] || row['post_id'] || '',
        createdAt,
        type: (row['Type'] || row['type'] || 'photo').toLowerCase() as any,
        likes: parseInt(row['Likes'] || row['likes'] || '0'),
        comments: parseInt(row['Comments'] || row['comments'] || '0'),
        tips: parseFloat(row['Tips'] || row['tips'] || '0'),
        ppvRevenue: parseFloat(row['PPV Revenue'] || row['ppv_revenue'] || '0'),
        totalRevenue: parseFloat(row['Total Revenue'] || row['total_revenue'] || '0'),
        mediaCount: parseInt(row['Media Count'] || row['media_count'] || '1')
      };
    });
  }

  // Calculate summary
  const dates = Array.from(dateSet).filter(d => d).sort();
  result.summary = {
    totalTransactions: result.transactions.length,
    totalEarnings: result.earnings.reduce((sum, e) => sum + e.earnings, 0),
    totalSubscribers: result.subscribers.filter(s => s.status === 'active').length,
    totalPosts: result.posts.length,
    dateRange: {
      start: dates[0] || '',
      end: dates[dates.length - 1] || ''
    }
  };

  return result;
}

export function parseOnlyFansCSV(csvContent: string, type: 'performance'): any[] {
  // Legacy CSV parser for backwards compatibility
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (type === 'performance') {
    return records.map((row: any) => ({
      date: row['Date'] || row['date'] || '',
      assetUrl: row['Asset URL'] || row['assetUrl'] || '',
      platformType: 'onlyfans',
      impressions: parseInt(row['Impressions'] || row['impressions'] || '0'),
      clicks: parseInt(row['Clicks'] || row['clicks'] || '0'),
      ppvPurchases: parseInt(row['PPV Purchases'] || row['ppvPurchases'] || '0'),
      subscriptions: parseInt(row['Subscriptions'] || row['subscriptions'] || '0'),
      revenueCents: Math.round(parseFloat(row['Revenue'] || row['revenue'] || '0') * 100)
    }));
  }

  return records;
}

function determineSubscriptionStatus(expiryDate?: string): 'active' | 'expired' | 'cancelled' {
  if (!expiryDate) return 'active';
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  if (expiry < now) return 'expired';
  return 'active';
}