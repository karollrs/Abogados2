import { 
  Phone, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Search 
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { LeadsTable } from "@/components/LeadsTable";
import { useLeads, useStats } from "@/hooks/use-leads";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Mock chart data for placeholder
const chartData = [
  { name: 'Family Law', value: 400, color: '#3b82f6' },
  { name: 'Criminal', value: 300, color: '#ef4444' },
  { name: 'Corporate', value: 300, color: '#10b981' },
  { name: 'Traffic', value: 200, color: '#f59e0b' },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: leads, isLoading: leadsLoading } = useLeads();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 animate-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">TUS ABOGADOS 24/7</h1>
            <p className="text-muted-foreground mt-1">CRM Dashboard & Lead Management</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                placeholder="Search leads..." 
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
              />
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
              + New Lead
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard 
            title="Total Leads" 
            value={stats?.totalLeads ?? 0}
            icon={<Phone className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle="+12% from last month"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard 
            title="Qualified" 
            value={stats?.qualifiedLeads ?? 0}
            icon={<CheckCircle className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle={`${stats?.totalLeads ? Math.round(((stats.qualifiedLeads || 0) / stats.totalLeads) * 100) : 0}% of total`}
          />
          <StatsCard 
            title="Converted" 
            value={stats?.convertedLeads ?? 0}
            icon={<TrendingUp className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle={`${stats?.qualifiedLeads ? Math.round(((stats.convertedLeads || 0) / stats.qualifiedLeads) * 100) : 0}% conversion rate`}
          />
          <StatsCard 
            title="Avg Response" 
            value={`${stats?.avgResponseTimeMinutes ?? 0}m`}
            icon={<Clock className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle="Response time average"
            trend={{ value: -5, isPositive: true }}
          />
        </div>

        {/* Middle Section: Chart + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Widget */}
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <h3 className="font-display font-semibold text-lg mb-6">Distribution by Case</h3>
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">1.2k</span>
                <span className="text-xs text-muted-foreground">Cases</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* Table Widget */}
          <div className="lg:col-span-2">
            <LeadsTable leads={leads || []} isLoading={leadsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
