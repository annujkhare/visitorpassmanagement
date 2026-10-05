import React, { useState } from "react";
import {
  Sliders,
  Building2,
  Users,
  Server,
  Key,
  Shield,
  Copy,
  Check,
  Plus,
  Terminal,
  Container,
  Layers,
  FileCode,
} from "lucide-react";

export const AdminView = ({
  users = [],
  organizations = [],
  currentOrg,
  onUpdateOrg,
  onCreateOrg,
  onCreateStaff,
}) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [copiedFile, setCopiedFile] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "host",
    department: "Engineering & R&D",
    phone: "",
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const [orgForm, setOrgForm] = useState(currentOrg);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const dockerfileSnippet = `# Multi-stage production Dockerfile for MERN Visitor Pass Management System
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "server.js"]`;

  const dockerComposeSnippet = `version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    container_name: visitor-pass-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  app:
    build: .
    container_name: visitor-pass-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://mongodb:27017/visitor_pass_db
      JWT_SECRET: visitor-pass-system-jwt-secret-key-2026
    depends_on:
      - mongodb
    ports:
      - "3000:3000"

volumes:
  mongodb_data:`;

  const nginxSnippet = `server {
    listen 80;
    server_name visitorpass.company.internal;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            System Administration & Multi-Tenant Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure tenant security parameters, register gate security staff,
            and export production Docker deployment blueprints.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "settings"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Organization Settings
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "staff"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Users & Security Staff ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("docker")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "docker"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Container className="w-3.5 h-3.5 text-blue-600" />
            Docker + Nginx
          </button>
        </div>
      </div>

      {activeTab === "settings" && orgForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tenant Security & Pass Policies
              </h2>
              <p className="text-xs text-slate-500">
                Configure entry requirements for {orgForm.name}
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold">
              {orgForm.code}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Display Name
              </label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                value={orgForm.address}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, address: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security Desk Contact Email
              </label>
              <input
                type="email"
                value={orgForm.email}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, email: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pass Validity Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={orgForm.passValidityHours}
                onChange={(e) =>
                  setOrgForm({
                    ...orgForm,
                    passValidityHours: parseInt(e.target.value) || 8,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Enforced Security Features
            </h3>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={orgForm.requireHostApproval}
                onChange={(e) =>
                  setOrgForm({
                    ...orgForm,
                    requireHostApproval: e.target.checked,
                  })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Mandatory Host Approval
                </span>
                <span className="text-[11px] text-slate-500">
                  Pre-registered guests cannot be issued a pass until the
                  internal employee confirms the invite.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={orgForm.requireOtp}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, requireOtp: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Two-Factor OTP Gate Verification
                </span>
                <span className="text-[11px] text-slate-500">
                  Requires visitor to enter a 6-digit PIN sent via SMS at the
                  security gate turnstile.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => onUpdateOrg(orgForm)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm"
            >
              Save Organization Policies
            </button>
          </div>
        </div>
      )}

      {/* Users and staff */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registered Staff & Personnel
              </h2>
              <p className="text-xs text-slate-500">
                Internal hosts, security guards, and system administrators
              </p>
            </div>
            <button
              onClick={() => setIsAddingStaff(!isAddingStaff)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>

          {isAddingStaff && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800">
                Register New Staff Account
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
                <select
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="host">Host / Employee</option>
                  <option value="security">Security / Guard</option>
                  <option value="admin">System Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="Department"
                  value={newStaff.department}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, department: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddingStaff(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newStaff.name || !newStaff.email) {
                      alert("Please provide name and email");
                      return;
                    }
                    await onCreateStaff(newStaff);
                    setIsAddingStaff(false);
                    setNewStaff({
                      name: "",
                      email: "",
                      role: "host",
                      department: "Engineering & R&D",
                      phone: "",
                    });
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Save Account
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Security Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              u.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            }
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "security"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.role === "host"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.department || "General"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {u.phone || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <Shield className="w-3 h-3" /> Active & Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "docker" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <Container className="w-4 h-4" />
                Bonus Challenge: Containerized Deployment
              </div>
              <h2 className="text-xl font-bold">
                Docker Compose + Nginx Reverse Proxy
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Ready-to-deploy multi-container architecture packaging Express
                backend, React frontend, MongoDB document store, and Nginx
                reverse proxy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  Dockerfile (Multi-Stage Node 20)
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(dockerfileSnippet, "dockerfile")
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
                >
                  {copiedFile === "dockerfile" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {dockerfileSnippet}
              </pre>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  docker-compose.yml (App + Mongo)
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(dockerComposeSnippet, "compose")
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
                >
                  {copiedFile === "compose" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {dockerComposeSnippet}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
                <Terminal className="w-4 h-4 text-purple-600" />
                nginx.conf (Reverse Proxy & SSL Termination)
              </div>
              <button
                onClick={() => copyToClipboard(nginxSnippet, "nginx")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
              >
                {copiedFile === "nginx" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {nginxSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
