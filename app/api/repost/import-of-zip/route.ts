import { NextRequest, NextResponse } from 'next/server';
import { parseOnlyFansZip, parseOnlyFansCSV } from '@/src/utils/of-import-parser';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let importData: any;
    
    if (file.name.endsWith('.zip')) {
      // Handle ZIP file with multiple CSVs
      const buffer = await file.arrayBuffer();
      const result = await parseOnlyFansZip(buffer);
      
      // Transform the parsed data into records for the backend
      const performanceRecords: any[] = [];
      
      // Convert posts to performance records
      result.posts.forEach(post => {
        performanceRecords.push({
          date: post.createdAt,
          assetUrl: `onlyfans/post/${post.postId}`,
          platformType: 'onlyfans',
          impressions: 0, // Not available in OF export
          clicks: post.likes + post.comments,
          ppvPurchases: post.ppvRevenue > 0 ? 1 : 0,
          subscriptions: 0, // Not directly tied to posts
          revenueCents: Math.round(post.totalRevenue * 100)
        });
      });
      
      // Add daily earnings as aggregated records
      result.earnings.forEach(earning => {
        performanceRecords.push({
          date: earning.date,
          assetUrl: 'onlyfans/daily-summary',
          platformType: 'onlyfans',
          impressions: 0,
          clicks: 0,
          ppvPurchases: 0,
          subscriptions: 0,
          revenueCents: Math.round(earning.earnings * 100)
        });
      });
      
      // Store additional data for future use
      importData = {
        records: performanceRecords,
        metadata: {
          type: 'zip',
          summary: result.summary,
          hasTransactions: result.transactions.length > 0,
          hasSubscribers: result.subscribers.length > 0,
          hasPosts: result.posts.length > 0,
          hasEarnings: result.earnings.length > 0
        },
        // Store raw data for advanced features later
        rawData: {
          transactions: result.transactions.slice(0, 100), // Sample for now
          subscribers: result.subscribers.slice(0, 100),
          earnings: result.earnings,
          posts: result.posts.slice(0, 100)
        }
      };
      
    } else if (file.name.endsWith('.csv')) {
      // Handle single CSV file (backwards compatibility)
      const text = await file.text();
      const records = parseOnlyFansCSV(text, 'performance');
      
      importData = {
        records,
        metadata: {
          type: 'csv',
          recordCount: records.length
        }
      };
    } else {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a ZIP or CSV file from OnlyFans export.' 
      }, { status: 400 });
    }

    // Send to backend API
    const response = await fetch(`${API_URL}/repost/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(importData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to import data');
    }

    // Mark OnlyFans as connected after successful import
    if (data.imported > 0) {
      try {
        await fetch(`${API_URL}/platforms/onlyfans/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            connected: true,
            metadata: {
              lastImport: new Date().toISOString(),
              importType: importData.metadata.type,
              ...importData.metadata.summary
            }
          })
        });
      } catch (e) {
        console.error('Failed to update OF connection status:', e);
      }
    }

    return NextResponse.json({
      imported: data.imported || 0,
      message: 'Successfully imported OnlyFans data',
      details: importData.metadata
    });
    
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to import OnlyFans data' 
    }, { status: 500 });
  }
}