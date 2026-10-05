import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, UserRound, LockKeyhole, Phone, Building2, Camera, Upload } from "lucide-react";

export function RegisterView({ onRegistered }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", company: "", photoUrl: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, photoUrl: reader.result || "" }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "visitor" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      onRegistered(data.user);
      navigate("/passes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Visitor Registration</h1>
          <p className="mt-1 text-sm text-slate-500">Create your visitor account and pre-register.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[["name","Full Name","text",UserRound], ["email","Email","email",UserRound], ["phone","Phone Number","tel",Phone], ["company","Company","text",Building2], ["password","Password","password",LockKeyhole]].map(([key,label,type,Icon]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold text-slate-700">{label}</span>
              <div className="relative mt-1.5">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required={key !== "company"} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500" />
              </div>
            </label>
          ))}
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Visitor Photo</span>
            <div className="mt-1.5 flex items-center gap-3">
              {form.photoUrl ? <img src={form.photoUrl} alt="Visitor preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200" /> : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Camera className="w-4 h-4 text-slate-400" /></div>}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Upload className="w-3.5 h-3.5" /> Upload Photo
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
          </label>
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</div>}
          <button disabled={loading} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60">{loading ? "Creating account..." : "Create Visitor Account"}</button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-5">Already registered? <Link to="/" className="font-semibold text-emerald-600">Sign in</Link></p>
      </div>
    </div>
  );
}
