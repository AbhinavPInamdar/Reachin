'use client';

import { useState, useEffect } from 'react';

interface Email {
  _id: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  category: string;
  categoryConfidence: number;
  receivedAt: string;
  folder: string;
  accountId: string;
}

interface Account {
  _id: string;
  accountId: string;
  email: string;
  displayName: string;
  enabled: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = {
  async getEmails(accountId?: string, folder?: string, category?: string) {
    let url = `${API_BASE_URL}/api/emails?limit=20`;
    if (accountId) url += `&accountId=${accountId}`;
    if (folder) url += `&folder=${folder}`;
    if (category) url += `&category=${category}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return data.data.emails;
  },

  async getAccounts() {
    const response = await fetch(`${API_BASE_URL}/api/accounts`);
    const data = await response.json();
    return data.data;
  },

  async searchEmails(searchText: string) {
    const response = await fetch(`${API_BASE_URL}/api/emails/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: searchText })
    });
    const data = await response.json();
    return data.data.emails;
  },

  async categorizeEmail(emailId: string) {
    const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/categorize`, {
      method: 'POST'
    });
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    const data = await response.json();
    return data.data;
  },

  async getReplySuggestions(emailId: string) {
    const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/reply-suggestions`);
    const data = await response.json();
    return data.data;
  },

  async syncAllAccounts() {
    const response = await fetch(`${API_BASE_URL}/api/imap/status`);
    const statusData = await response.json();
    
    if (statusData.success && statusData.data) {
      const accountIds = Object.keys(statusData.data);
      const syncPromises = accountIds.map(accountId => 
        fetch(`${API_BASE_URL}/api/imap/sync/${accountId}`, { method: 'POST' })
      );
      
      await Promise.all(syncPromises);
      return { success: true, synced: accountIds.length };
    }
    
    return { success: false, error: 'No accounts found' };
  }
};

function getCategoryColor(category: string) {
  switch (category) {
    case 'Interested': return 'bg-green-100 text-green-800';
    case 'Meeting Booked': return 'bg-blue-100 text-blue-800';
    case 'Not Interested': return 'bg-red-100 text-red-800';
    case 'Spam': return 'bg-gray-100 text-gray-800';
    case 'Out of Office': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString() + ' ' + 
         new Date(dateString).toLocaleTimeString();
}

export default function EmailDashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replySuggestions, setReplySuggestions] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [emailsData, accountsData, statsData] = await Promise.all([
        api.getEmails(selectedAccount, selectedFolder, selectedCategory),
        api.getAccounts(),
        api.getStats()
      ]);
      setEmails(emailsData);
      setAccounts(accountsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchText.trim()) {
      loadData();
      return;
    }
    
    try {
      setLoading(true);
      const results = await api.searchEmails(searchText);
      setEmails(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter() {
    loadData();
  }

  async function handleCategorize(emailId: string) {
    try {
      await api.categorizeEmail(emailId);
      loadData();
    } catch (error) {
      console.error('Categorization error:', error);
    }
  }

  async function handleGetReplySuggestions(email: Email) {
    try {
      setSelectedEmail(email);
      const suggestions = await api.getReplySuggestions(email._id);
      setReplySuggestions(suggestions.suggestions || []);
    } catch (error) {
      console.error('Reply suggestions error:', error);
    }
  }

  async function handleSyncEmails() {
    try {
      setSyncing(true);
      const result = await api.syncAllAccounts();
      
      if (result.success) {
        setLastSync(new Date().toLocaleTimeString());
        // Wait a moment for emails to be processed
        setTimeout(() => {
          loadData();
        }, 2000);
      } else {
        console.error('Sync failed:', result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading emails...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-light text-black">ReachInbox Email Aggregator</h1>
              <p className="text-black mt-2">Manage your emails with AI categorization</p>
            </div>
            {lastSync && (
              <div className="text-sm text-black">
                Last sync: {lastSync}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.totalEmails || 0}</div>
            <div className="text-black text-sm mt-1">Total</div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.interestedEmails || 0}</div>
            <div className="text-black text-sm mt-1">Interested</div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.meetingBookedEmails || 0}</div>
            <div className="text-black text-sm mt-1">Meetings</div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.notInterestedEmails || 0}</div>
            <div className="text-black text-sm mt-1">Not Interested</div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.spamEmails || 0}</div>
            <div className="text-black text-sm mt-1">Spam</div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <div className="text-2xl font-light text-black">{stats.outOfOfficeEmails || 0}</div>
            <div className="text-black text-sm mt-1">Out of Office</div>
          </div>
        </div>

        <div className="border border-gray-200 rounded p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search emails..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
              />
            </div>

            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account._id} value={account.accountId}>
                  {account.displayName || account.email}
                </option>
              ))}
            </select>

            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">All Folders</option>
              <option value="INBOX">INBOX</option>
              <option value="Sent">Sent</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">All Categories</option>
              <option value="Interested">Interested</option>
              <option value="Meeting Booked">Meeting Booked</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Spam">Spam</option>
              <option value="Out of Office">Out of Office</option>
            </select>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleFilter}
              className="px-6 py-2 border border-black text-black rounded hover:bg-black hover:text-white transition-colors"
            >
              Filter
            </button>
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className={`px-6 py-2 rounded transition-colors ${
                syncing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {syncing ? 'Syncing...' : 'Sync Emails'}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-black">Emails ({emails.length})</h2>
              {syncing && (
                <div className="flex items-center text-black">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  <span className="text-sm">Syncing emails...</span>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {emails.length === 0 ? (
              <div className="px-6 py-12 text-center text-black">
                No emails found
              </div>
            ) : (
              emails.map((email) => (
                <div key={email._id} className="px-6 py-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-medium text-black">
                          {email.from}
                        </span>
                        <span className="text-black">→</span>
                        <span className="text-black">
                          {email.to.join(', ')}
                        </span>
                        {email.category && (
                          <span className="px-3 py-1 text-xs border border-black rounded text-black">
                            {email.category}
                            {email.categoryConfidence && 
                              ` (${Math.round(email.categoryConfidence * 100)}%)`
                            }
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-black mb-2">
                        {email.subject || 'No Subject'}
                      </h3>

                      <p className="text-black text-sm mb-3 leading-relaxed">
                        {email.bodyText?.substring(0, 200) || 'No content'}
                        {email.bodyText && email.bodyText.length > 200 && '...'}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-black">
                        <span>{formatDate(email.receivedAt)}</span>
                        <span>{email.folder}</span>
                        <span>{email.accountId}</span>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      {!email.category && (
                        <button
                          onClick={() => handleCategorize(email._id)}
                          className="px-4 py-2 text-xs border border-black text-black rounded hover:bg-black hover:text-white transition-colors"
                        >
                          Categorize
                        </button>
                      )}
                      <button
                        onClick={() => handleGetReplySuggestions(email)}
                        className="px-4 py-2 text-xs bg-black text-white rounded hover:bg-gray-800 transition-colors"
                      >
                        Reply AI
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedEmail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">AI Reply Suggestions</h3>
                    <p className="text-sm text-gray-600">Smart replies powered by AI</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmail(null);
                      setReplySuggestions([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Original Email Preview */}
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-blue-800">Original Email</span>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900 text-lg">{selectedEmail.subject || 'No Subject'}</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">From:</span> {selectedEmail.from}
                    </div>
                    <div className="mt-4 text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-lg">
                      {selectedEmail.bodyText?.substring(0, 300)}
                      {selectedEmail.bodyText && selectedEmail.bodyText.length > 300 && (
                        <span className="text-blue-600 font-medium">... read more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggested Replies */}
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-lg font-semibold text-gray-900">Suggested Replies</span>
                  </div>
                  
                  {replySuggestions.map((suggestion, index) => (
                    <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-700">AI</span>
                          </div>
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                              {suggestion.tone} • {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4 text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                        {suggestion.text}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(suggestion.text);
                            // Better notification
                            const button = event?.target as HTMLButtonElement;
                            const originalText = button.textContent;
                            button.textContent = '✓ Copied!';
                            button.className = button.className.replace('bg-black', 'bg-green-600');
                            setTimeout(() => {
                              button.textContent = originalText;
                              button.className = button.className.replace('bg-green-600', 'bg-black');
                            }, 2000);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium group-hover:shadow-md"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {replySuggestions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-lg font-medium">Generating AI suggestions...</p>
                    <p className="text-gray-500 text-sm mt-1">This may take a few moments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}