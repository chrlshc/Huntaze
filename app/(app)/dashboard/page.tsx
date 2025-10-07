export { default } from './page-old'
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Messages Sent</span>
              <MessageSquare className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">{stats.messages.toLocaleString()}</span>
              <span className={`text-sm ${stats.messagesChange > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.messagesChange > 0 ? '+' : ''}{stats.messagesChange}%
              </span>
            </div>
          </div>

          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Engagement Rate</span>
              <Activity className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">{stats.engagement}%</span>
              <span className={`text-sm ${stats.engagementChange > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.engagementChange > 0 ? '+' : ''}{stats.engagementChange}%
              </span>
            </div>
          </div>

          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-secondary">Content Created</span>
              <Package className="w-5 h-5 text-content-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">346</span>
              <span className="text-sm text-success">+24%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border">
            <div className="p-6 border-b border-border-light dark:border-border">
              <h3 className="text-lg font-semibold text-content-primary">Top performing content</h3>
            </div>
            <div className="divide-y divide-border-light dark:divide-border">
              {topContent.map((item, index) => (
                <div key={index} className="p-4 hover:bg-surface-hover-light dark:hover:bg-surface-hover transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-content-primary">{item.title}</h4>
                      <p className="text-sm text-content-tertiary mt-0.5">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-content-primary">{item.revenue}</p>
                      <p className="text-sm text-success">{item.change}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border-light dark:border-border">
              <Link href="/analytics/content" className="text-sm text-primary hover:text-primary-hover transition-colors">
                View all content →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-xl border border-border-light dark:border-border p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Quick actions</h3>
            <div className="space-y-3">
              <Link href="/campaigns/new" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">Create campaign</p>
                    <p className="text-sm text-content-tertiary">Launch a new marketing campaign</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>

              <Link href="/ai/content" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">Generate content</p>
                    <p className="text-sm text-content-tertiary">Use AI to create new posts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>

              <Link href="/messages" className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">View messages</p>
                    <p className="text-sm text-content-tertiary">12 new messages waiting</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-content-tertiary group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
