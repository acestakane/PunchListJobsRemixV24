import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff, ClipboardList, Users, ArrowLeft, CheckCircle, KeyRound, Mail } from "lucide-react";
import TradeSelect from "../components/TradeSelect";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HERO_BG = "https://images.unsplash.com/photo-1693478501743-799eefbc0ecd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwdGVhbSUyMHdvcmtpbmd8ZW58MHx8fHwxNzczMzk4OTM5fDA&ixlib=rb-4.1.0&q=85";

export default function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { siteName, tagline, colors } = useTheme();
  const brand = colors.brand_color || "#2563EB";

  const [mode, setMode] = useState(params.get("mode") || "login");
  const [role, setRole] = useState(params.get("role") || "crew");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState([]);

  useEffect(() => {
    axios.get(`${API}/trades`).then(r => setGrouped(r.data.categories || [])).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "",
    phone: "", address: "", company_name: "", referral_code_used: "", trade: ""
  });

  // Address autocomplete
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [showAddrSugg, setShowAddrSugg] = useState(false);
  const addrTimer = useRef(null);

  const searchAddr = (q) => {
    clearTimeout(addrTimer.current);
    if (!q || q.length < 3) { setAddrSuggestions([]); return; }
    addrTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/utils/address/search`, { params: { q, limit: 5 } });
        setAddrSuggestions(res.data.results || res.data || []);
        setShowAddrSugg(true);
      } catch { setAddrSuggestions([]); }
    }, 350);
  };

  const [agreed, setAgreed] = useState({ terms: false, privacy: false, community: false });

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotDone, setForgotDone] = useState(null);
  const [resetToken, setResetToken] = useState(params.get("token") || "");
  const [newPassword, setNewPassword] = useState("");

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name}!`);
        if (user.role === "crew") navigate("/crew/dashboard");
        else if (user.role === "contractor") navigate("/contractor/dashboard");
        else navigate("/admin/dashboard");
      } else {
        if (!form.first_name.trim()) { toast.error("First name is required"); setLoading(false); return; }
        if (!form.last_name.trim()) { toast.error("Last name is required"); setLoading(false); return; }
        if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); setLoading(false); return; }
        if (!agreed.terms || !agreed.privacy || !agreed.community) {
          toast.error("Please accept all required agreements to continue.");
          setLoading(false); return;
        }
        const payload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          referral_code_used: form.referral_code_used,
          role,
        };
        if (role === "contractor") payload.company_name = form.company_name;
        if (role === "crew") payload.trade = form.trade;
        const user = await register(payload);
        toast.success(`Welcome to ${siteName}, ${user.name}! You're on the free plan.`);
        if (user.role === "crew") navigate("/crew/dashboard");
        else navigate("/contractor/dashboard");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      setForgotDone(res.data);
      toast.success("Reset link generated.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send reset link");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token: resetToken, new_password: newPassword });
      toast.success("Password reset! You can now log in.");
      setMode("login"); setResetToken(""); setNewPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid or expired token");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-white text-slate-800 bg-white";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(29,78,216,0.92) 0%, rgba(37,99,235,0.4) 100%), url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: brand }}>
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-extrabold text-xl" style={{ fontFamily: "Manrope, sans-serif" }}>{siteName}</div>
              <div className="text-blue-200 text-xs">{tagline}</div>
            </div>
          </Link>
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Your work.<br />Your terms.
            </h2>
            <p className="text-slate-300 text-lg mb-8">Real-time workforce marketplace for blue collar professionals.</p>
            <div className="space-y-3">
              {["Free plan included", "Live job map", "Instant payouts", "AI job matching"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span className="text-slate-200">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:w-1/2 bg-white dark:bg-[#020617] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          {/* ── Forgot Password ─────────────────────── */}
          {mode === "forgot" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5" style={{ color: brand }} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Forgot Password</h1>
                  <p className="text-xs text-slate-400">Enter your email to receive a reset link</p>
                </div>
              </div>
              {!forgotDone ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Email Address *</label>
                    <input type="email" required value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className={inputCls} style={{ borderColor: "transparent" }}
                      placeholder="you@example.com" data-testid="forgot-email-input" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-colors disabled:opacity-60"
                    style={{ backgroundColor: brand }}
                    data-testid="forgot-submit-btn">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button type="button" onClick={() => setMode("login")}
                    className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    data-testid="back-to-login-btn">
                    Back to Log In
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Check your email</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">A reset link has been sent if this email is registered.</p>
                  </div>
                  {forgotDone.demo_token && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">Demo Mode — Reset Token</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-mono break-all mb-3">{forgotDone.demo_token}</p>
                      <Link to={forgotDone.reset_url} className="text-xs font-semibold hover:underline" style={{ color: brand }}
                        data-testid="go-to-reset-link">
                        Go to reset form →
                      </Link>
                    </div>
                  )}
                  <button onClick={() => { setMode("login"); setForgotDone(null); setForgotEmail(""); }}
                    className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:border-slate-300 transition-colors"
                    data-testid="back-to-login-btn">
                    Back to Log In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Reset Password ───────────────────────── */}
          {mode === "reset" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5" style={{ color: brand }} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Reset Password</h1>
                  <p className="text-xs text-slate-400">Enter your reset token and a new password</p>
                </div>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Reset Token *</label>
                  <input type="text" required value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    className={inputCls + " font-mono"}
                    placeholder="Paste your reset token" data-testid="reset-token-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">New Password *</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} required value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={inputCls + " pr-10"}
                      placeholder="Min 6 characters" data-testid="reset-new-password-input" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-colors disabled:opacity-60"
                  style={{ backgroundColor: brand }}
                  data-testid="reset-submit-btn">
                  {loading ? "Resetting..." : "Set New Password"}
                </button>
                <button type="button" onClick={() => setMode("login")}
                  className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Back to Log In
                </button>
              </form>
            </div>
          )}

          {/* ── Login / Register ─────────────────────── */}
          {(mode === "login" || mode === "register") && (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-8">
                <button onClick={() => setMode("login")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === "login" ? "text-white shadow-md" : "text-slate-500 dark:text-slate-400"}`}
                  style={mode === "login" ? { backgroundColor: brand } : {}}
                  data-testid="auth-login-tab">
                  Log In
                </button>
                <button onClick={() => setMode("register")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === "register" ? "text-white shadow-md" : "text-slate-500 dark:text-slate-400"}`}
                  style={mode === "register" ? { backgroundColor: brand } : {}}
                  data-testid="auth-register-tab">
                  Sign Up
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {mode === "login" ? `Sign in to your ${siteName} account` : "Join thousands of workers and contractors"}
              </p>

              {/* Role Selector (Register only) */}
              {mode === "register" && (
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setRole("crew")}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-bold text-sm transition-all`}
                    style={role === "crew" ? { borderColor: brand, backgroundColor: "#EFF6FF", color: brand } : { borderColor: "#E2E8F0", color: "#94A3B8" }}
                    data-testid="role-crew-btn">
                    <Users className="w-5 h-5" />
                    Crew Member
                  </button>
                  <button onClick={() => setRole("contractor")}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-bold text-sm transition-all`}
                    style={role === "contractor" ? { borderColor: brand, backgroundColor: "#EFF6FF", color: brand } : { borderColor: "#E2E8F0", color: "#94A3B8" }}
                    data-testid="role-contractor-btn">
                    <ClipboardList className="w-5 h-5" />
                    Contractor
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name + Last Name (register only) */}
                {mode === "register" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">First Name *</label>
                      <input type="text" value={form.first_name}
                        onChange={e => update("first_name", e.target.value)}
                        className={inputCls}
                        placeholder="John" required
                        data-testid="reg-first-name-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Last Name *</label>
                      <input type="text" value={form.last_name}
                        onChange={e => update("last_name", e.target.value)}
                        className={inputCls}
                        placeholder="Smith" required
                        data-testid="reg-last-name-input" />
                    </div>
                  </div>
                )}

                {mode === "register" && role === "contractor" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Company Name</label>
                    <input type="text" value={form.company_name}
                      onChange={e => update("company_name", e.target.value)}
                      className={inputCls}
                      placeholder="Smith Construction LLC"
                      data-testid="reg-company-input" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Email Address *</label>
                  <input type="email" value={form.email}
                    onChange={e => update("email", e.target.value)}
                    className={inputCls}
                    placeholder="john@example.com" required
                    data-testid="auth-email-input" />
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Phone Number</label>
                    <input type="tel" value={form.phone}
                      onChange={e => update("phone", e.target.value)}
                      className={inputCls}
                      placeholder="+1 (555) 000-0000"
                      data-testid="reg-phone-input" />
                  </div>
                )}

                {mode === "register" && (
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Address</label>
                    <input type="text" value={form.address}
                      onChange={e => { update("address", e.target.value); searchAddr(e.target.value); }}
                      onFocus={() => addrSuggestions.length > 0 && setShowAddrSugg(true)}
                      onBlur={() => setTimeout(() => setShowAddrSugg(false), 200)}
                      className={inputCls}
                      placeholder="123 Main St, City, State"
                      data-testid="reg-address-input" autoComplete="off" />
                    {showAddrSugg && addrSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl mt-1 overflow-hidden">
                        {addrSuggestions.map((s, i) => (
                          <button key={i} type="button"
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            onMouseDown={() => { update("address", s.full_address || s); setShowAddrSugg(false); setAddrSuggestions([]); }}>
                            <span className="font-semibold text-slate-800 dark:text-white text-xs">{s.full_address || s}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {mode === "register" && role === "crew" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Primary Trade</label>
                    <TradeSelect grouped={grouped} value={form.trade}
                      onChange={v => update("trade", v)}
                      placeholder="Select a trade"
                      data-testid="reg-trade-select" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={form.password}
                      onChange={e => update("password", e.target.value)}
                      className={inputCls + " pr-10"}
                      placeholder="Min 6 characters" required
                      data-testid="auth-password-input" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")}
                      className="mt-1.5 text-xs font-semibold hover:underline float-right"
                      style={{ color: brand }}
                      data-testid="forgot-password-link">
                      Forgot password?
                    </button>
                  )}
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">Referral Code (optional)</label>
                    <input type="text" value={form.referral_code_used}
                      onChange={e => update("referral_code_used", e.target.value.toUpperCase())}
                      className={inputCls}
                      placeholder="ABC12345"
                      data-testid="reg-referral-input" />
                  </div>
                )}

                {/* Agreement checkboxes */}
                {mode === "register" && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                    {[
                      { key: "terms",     label: "Terms & Conditions",   slug: "terms" },
                      { key: "privacy",   label: "Privacy Policy",       slug: "privacy" },
                      { key: "community", label: "Community Guidelines", slug: "community-guidelines" },
                    ].map(({ key, label, slug }) => (
                      <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={agreed[key]}
                          onChange={e => setAgreed(a => ({ ...a, [key]: e.target.checked }))}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 flex-shrink-0"
                          data-testid={`agree-${key}`} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                          I agree to the{" "}
                          <Link to={`/pages/${slug}`} target="_blank" rel="noopener noreferrer"
                            className="font-semibold hover:underline"
                            style={{ color: brand }}
                            data-testid={`cms-link-${slug}`}>
                            {label}
                          </Link>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full text-white py-3 rounded-xl font-bold text-base hover:opacity-90 transition-colors disabled:opacity-60 mt-2"
                  style={{ backgroundColor: brand }}
                  data-testid="auth-submit-btn">
                  {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
                </button>
              </form>

              {mode === "login" && (
                <p className="text-center text-xs text-slate-400 mt-4">
                  Admin? Use your admin credentials to access the platform.
                </p>
              )}

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                {mode === "login" ? (
                  <>Don&apos;t have an account? <button onClick={() => setMode("register")} className="font-semibold hover:underline" style={{ color: brand }} data-testid="switch-to-register">Sign up free</button></>
                ) : (
                  <>Already have an account? <button onClick={() => setMode("login")} className="font-semibold hover:underline" style={{ color: brand }} data-testid="switch-to-login">Log in</button></>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
