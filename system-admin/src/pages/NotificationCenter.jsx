import React, { useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldAlert,
  Siren,
  ToggleLeft,
  ToggleRight,
  TriangleAlert,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const initialChannels = [
  {
    id: 'otp',
    title: 'OTP Email Channel',
    note: 'Used for admin and staff OTP authentication workflows.',
    icon: Mail,
    status: 'Primary',
    enabled: true,
    deliveryMode: 'Email',
    testLabel: 'Send Test OTP',
    template: 'Your MediLite admin access code is {{otp}}. It expires in {{minutes}} minutes.',
    responseTarget: '< 30 sec',
    reliability: 92,
  },
  {
    id: 'reminders',
    title: 'Reminder Notifications',
    note: 'Medicine reminders, due notices, and patient follow-up messaging.',
    icon: BellRing,
    status: 'Managed',
    enabled: true,
    deliveryMode: 'Email + In-app',
    testLabel: 'Send Test Reminder',
    template: 'Reminder: {{medicine}} is due at {{time}}. Please take it as prescribed.',
    responseTarget: '< 5 min',
    reliability: 88,
  },
  {
    id: 'emergency',
    title: 'Emergency Escalation',
    note: 'High-priority alerts for ambulance booking and critical operations.',
    icon: Siren,
    status: 'Escalated',
    enabled: true,
    deliveryMode: 'Email + Priority Banner',
    testLabel: 'Trigger Test Escalation',
    template: 'Emergency dispatch requested for {{patient}}. Escalate to command workflow immediately.',
    responseTarget: '< 2 min',
    reliability: 96,
  },
  {
    id: 'security',
    title: 'Security Announcements',
    note: 'Account review, suspicious activity alerts, and role changes.',
    icon: ShieldAlert,
    status: 'Governed',
    enabled: false,
    deliveryMode: 'In-app + Audit',
    testLabel: 'Send Security Alert',
    template: 'Security notice: {{event}} was detected on {{service}}. Review and acknowledge.',
    responseTarget: '< 10 min',
    reliability: 81,
  },
];

const activitySeed = [
  {
    id: 1,
    channel: 'OTP Email Channel',
    subject: 'Staff OTP send retried after SMTP reconnect',
    status: 'Recovered',
    time: '2 mins ago',
    color: 'emerald',
  },
  {
    id: 2,
    channel: 'Emergency Escalation',
    subject: 'Ambulance notification escalated to priority queue',
    status: 'Critical',
    time: '8 mins ago',
    color: 'red',
  },
  {
    id: 3,
    channel: 'Reminder Notifications',
    subject: '17 reminder messages queued for evening delivery',
    status: 'Scheduled',
    time: '21 mins ago',
    color: 'amber',
  },
  {
    id: 4,
    channel: 'Security Announcements',
    subject: 'Suspicious login notice governed by review policy',
    status: 'Watching',
    time: '36 mins ago',
    color: 'blue',
  },
];

const baseRules = [
  {
    id: 1,
    title: 'Priority 1 Fanout',
    text: 'Priority 1 events should fan out to email and in-app admin alerts.',
    owner: 'Platform Ops',
  },
  {
    id: 2,
    title: 'OTP Failure Visibility',
    text: 'OTP delivery failures should surface inside system monitoring immediately.',
    owner: 'Security Desk',
  },
  {
    id: 3,
    title: 'Inventory Warning Routing',
    text: 'Low stock and expiry warnings should feed both reports and alert center pages.',
    owner: 'Inventory Control',
  },
];

const statusTone = {
  Primary: 'bg-blue-100 text-blue-700',
  Managed: 'bg-violet-100 text-violet-700',
  Escalated: 'bg-red-100 text-red-700',
  Governed: 'bg-emerald-100 text-emerald-700',
};

const activityTone = {
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
};

const NotificationCenter = () => {
  const [channels, setChannels] = useState(initialChannels);
  const [activity, setActivity] = useState(activitySeed);
  const [rules, setRules] = useState(baseRules);
  const [selectedChannelId, setSelectedChannelId] = useState(initialChannels[0].id);
  const [refreshTick, setRefreshTick] = useState(0);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? channels[0],
    [channels, selectedChannelId]
  );

  const enabledCount = channels.filter((channel) => channel.enabled).length;
  const deliveryHealth = Math.round(
    channels.reduce((sum, channel) => sum + channel.reliability, 0) / channels.length
  );

  const handleToggle = (channelId) => {
    setChannels((current) =>
      current.map((channel) =>
        channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
      )
    );

    const toggled = channels.find((channel) => channel.id === channelId);
    if (!toggled) return;

    setActivity((current) => [
      {
        id: Date.now(),
        channel: toggled.title,
        subject: toggled.enabled ? 'Channel paused by system admin' : 'Channel re-enabled for delivery',
        status: toggled.enabled ? 'Paused' : 'Restored',
        time: 'Just now',
        color: toggled.enabled ? 'amber' : 'emerald',
      },
      ...current.slice(0, 5),
    ]);
  };

  const handleTest = (channel) => {
    setActivity((current) => [
      {
        id: Date.now(),
        channel: channel.title,
        subject: `${channel.testLabel} executed from control center`,
        status: channel.enabled ? 'Queued' : 'Blocked',
        time: 'Just now',
        color: channel.enabled ? 'blue' : 'red',
      },
      ...current.slice(0, 5),
    ]);
  };

  const handleTemplateChange = (value) => {
    setChannels((current) =>
      current.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, template: value } : channel
      )
    );
  };

  const handleRuleChange = (ruleId, value) => {
    setRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, text: value } : rule))
    );
  };

  const handleRefresh = () => {
    setRefreshTick((current) => current + 1);
    setActivity((current) => [
      {
        id: Date.now(),
        channel: 'Notification Center',
        subject: 'Delivery metrics refreshed and rule cache synchronized',
        status: 'Synced',
        time: 'Just now',
        color: 'emerald',
      },
      ...current.slice(0, 5),
    ]);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Notification Center"
          subtitle="Control how platform messages, alerts, and high-priority communication flows are organized."
        />

        <section className="mb-6 grid gap-5 xl:grid-cols-4">
          <MetricCard
            label="Enabled Channels"
            value={`${enabledCount}/${channels.length}`}
            note="Active delivery routes"
            tint="blue"
            icon={BellRing}
          />
          <MetricCard
            label="Delivery Health"
            value={`${deliveryHealth}%`}
            note="Average channel reliability"
            tint="emerald"
            icon={CheckCircle2}
          />
          <MetricCard
            label="Escalation Load"
            value="3"
            note="High-priority flows under watch"
            tint="amber"
            icon={TriangleAlert}
          />
          <MetricCard
            label="Last Sync"
            value={`${refreshTick}x`}
            note="Manual refreshes this session"
            tint="violet"
            icon={RefreshCw}
          />
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Channel Control</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Live Notification Channels</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Toggle delivery routes, launch test messages, and tune the communication posture for each system flow.
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Center
                </button>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {channels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    active={selectedChannelId === channel.id}
                    onSelect={() => setSelectedChannelId(channel.id)}
                    onToggle={() => handleToggle(channel.id)}
                    onTest={() => handleTest(channel)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Admin Message Rules</h2>
                  <p className="text-sm text-slate-500">Edit routing rules that govern how system notifications behave.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-[1.5rem] bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-900">{rule.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                        {rule.owner}
                      </span>
                    </div>
                    <textarea
                      value={rule.text}
                      onChange={(event) => handleRuleChange(rule.id, event.target.value)}
                      className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Selected Channel</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedChannel.title}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${statusTone[selectedChannel.status]}`}>
                  {selectedChannel.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <DetailPill label="Mode" value={selectedChannel.deliveryMode} />
                <DetailPill label="Target" value={selectedChannel.responseTarget} />
                <DetailPill label="Reliability" value={`${selectedChannel.reliability}%`} />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Template Editor</p>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Tokens supported
                  </span>
                </div>
                <textarea
                  value={selectedChannel.template}
                  onChange={(event) => handleTemplateChange(event.target.value)}
                  className="mt-3 min-h-40 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {['{{otp}}', '{{minutes}}', '{{medicine}}', '{{time}}', '{{patient}}', '{{event}}'].map((token) => (
                    <span
                      key={token}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Recent Delivery Activity</h2>
                  <p className="mt-2 text-sm text-slate-500">Live operational history for notification channels and admin-triggered actions.</p>
                </div>
                <Clock3 className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.channel}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.subject}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${activityTone[item.color]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const ChannelCard = ({ channel, active, onSelect, onToggle, onTest }) => {
  const Icon = channel.icon;

  return (
    <div
      className={`rounded-[1.75rem] border p-5 transition-all duration-300 ${
        active
          ? 'border-blue-200 bg-blue-50/70 shadow-md'
          : 'border-slate-100 bg-white hover:-translate-y-1 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={onSelect} className="flex flex-1 gap-4 text-left">
          <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{channel.title}</h3>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone[channel.status]}`}>
                {channel.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{channel.note}</p>
          </div>
        </button>

        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 ${
            channel.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {channel.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          {channel.enabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          <span>Reliability</span>
          <span>{channel.reliability}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${
              channel.reliability > 90 ? 'bg-emerald-500' : channel.reliability > 84 ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ width: `${channel.reliability}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onTest}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Send className="h-4 w-4" />
          {channel.testLabel}
        </button>
        <button
          onClick={onSelect}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
        >
          Configure
        </button>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, note, tint, icon: Icon }) => {
  const tones = {
    blue: 'from-blue-500/10 to-cyan-500/10 text-blue-600',
    emerald: 'from-emerald-500/10 to-green-500/10 text-emerald-600',
    amber: 'from-amber-500/10 to-yellow-500/10 text-amber-600',
    violet: 'from-violet-500/10 to-indigo-500/10 text-violet-600',
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${tones[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{note}</p>
    </div>
  );
};

const DetailPill = ({ label, value }) => (
  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
  </div>
);

export default NotificationCenter;
