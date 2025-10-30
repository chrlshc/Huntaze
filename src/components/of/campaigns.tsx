'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Play, Pause, BarChart3, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { OfMassMessageCampaign } from '@/lib/types/onlyfans';
import CreateCampaignModal from './create-campaign-modal';
import CampaignDetails from './campaign-details';
import { formatDistanceToNow } from 'date-fns';

export default function OfCampaigns() {
  const [campaigns, setCampaigns] = useState<OfMassMessageCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed'>('all');

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/of/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const response = await fetch(`/api/of/campaigns/${campaignId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchCampaigns(); // Refresh
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Campaign action error:', error);
    }
  };

  if (selectedCampaign) {
    return (
      <CampaignDetails
        campaignId={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="neutral" tone="soft">Draft</Badge>;
      case 'scheduled': return <Badge variant="progress" tone="soft">Scheduled</Badge>;
      case 'sending': return <Badge variant="sent" tone="soft">Sending</Badge>;
      case 'paused': return <Badge variant="progress" tone="soft">Paused</Badge>;
      case 'completed': return <Badge variant="sent" tone="soft">Completed</Badge>;
      case 'failed': return <Badge variant="failed" tone="soft">Failed</Badge>;
      default: return <Badge variant="neutral" tone="soft">Unknown</Badge>;
    }
  };

  type SortKey = 'name' | 'created' | 'recipients' | 'sent' | 'failed' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = campaigns.filter((c) => {
      const nameMatch = q.length === 0 || (c.name || '').toLowerCase().includes(q);
      const statusMatch = statusFilter === 'all' || c.status === statusFilter;
      return nameMatch && statusMatch;
    });
    const sorted = [...base].sort((a,b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'name': va = a.name || ''; vb = b.name || ''; break;
        case 'created': va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); break;
        case 'recipients': va = a.stats.totalRecipients; vb = b.stats.totalRecipients; break;
        case 'sent': va = a.stats.sentCount; vb = b.stats.sentCount; break;
        case 'failed': va = a.stats.failedCount; vb = b.stats.failedCount; break;
        case 'status': va = a.status; vb = b.status; break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [campaigns, query, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const toggleSelectAll = () => {
    const s = new Set(selected);
    if (allVisibleSelected) { filtered.forEach(c => s.delete(c.id)); }
    else { filtered.forEach(c => s.add(c.id)); }
    setSelected(s);
  }
  const toggleRow = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  return (
    <>
      {/* Page header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-semibold">Campaigns</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          New campaign
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-3 md:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns"
            aria-label="Search campaigns"
            className="w-full sm:max-w-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
          <div className="flex flex-wrap gap-1 sm:ml-auto">
            {["all","draft","scheduled","sending","paused","completed","failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`px-2.5 py-1 rounded-md text-xs border ${statusFilter===s? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800':'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Resource index list/table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-300">No campaigns</div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaign(c.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                      <div className="text-xs text-gray-500">Created {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</div>
                    </div>
                    {statusBadge(c.status)}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('name')}>Name</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('created')}>Created</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('recipients')}>Recipients</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('sent')}>Sent</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('failed')}>Failed</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const pct = c.stats.totalRecipients > 0 ? Math.round((c.stats.sentCount / c.stats.totalRecipients) * 100) : 0;
                    return (
                      <tr key={c.id} className="border-b last:border-b-0 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${c.name}`} checked={selected.has(c.id)} onChange={() => toggleRow(c.id)} /></td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium cursor-pointer" onClick={() => setSelectedCampaign(c.id)}>{c.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                        <td className="px-4 py-3">{c.stats.totalRecipients}</td>
                        <td className="px-4 py-3">{c.stats.sentCount} <span className="text-gray-500">({pct}%)</span></td>
                        <td className="px-4 py-3">{c.stats.failedCount}</td>
                        <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </>
  );
}
