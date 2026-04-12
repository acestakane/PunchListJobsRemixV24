import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Menu, X, ClipboardList, ChevronDown, User, Settings, LogOut, LayoutDashboard, Sliders, Archive, DollarSign, MessageCircle, CalendarRange, HelpCircle, Sun, Moon, Bell } from "lucide-react";
import { useWebSocket } from "../contexts/WebSocketContext";

export default function Navbar({ minimal = false }) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme, siteName, tagline } = useTheme();
  const { unreadMessages, alerts, clearAlerts } = useWebSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    const handler = (e) => { if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dashboardPath = user?.role === "crew" ? "/crew/dashboard"
    : user?.role === "contractor" ? "/contractor/dashboard"
    : "/admin/dashboard";

  const brand = colors.brand_color || "#2563EB";

  return (
    <nav className="shadow-lg sticky top-0 z-50" style={{ backgroundColor: "var(--theme-nav-bg)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand }}>
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-extrabold text-lg leading-none" style={{ fontFamily: "Manrope, sans-serif" }}>{siteName}</div>
              <div className="text-xs" style={{ color: "var(--theme-accent)" }}>{tagline}</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">

            {/* Alert Notifications */}
            {user && (
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setAlertsOpen(o => !o)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors relative"
                  data-testid="alerts-bell-btn"
                  title="Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" data-testid="alerts-badge">
                      {alerts.length > 9 ? "9+" : alerts.length}
                    </span>
                  )}
                </button>

                {alertsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50" data-testid="alerts-dropdown">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">Alerts</span>
                      {alerts.length > 0 && (
                        <button onClick={clearAlerts} className="text-[10px] text-slate-400 hover:text-red-400 transition-colors" data-testid="clear-alerts-btn">Clear all</button>
                      )}
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="text-center py-6">
                          <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">No alerts yet</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {alerts.map(a => (
                            <div key={a.id}
                              className={`p-2 rounded-lg text-xs ${
                                a.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                a.type === "warning" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              }`}
                              data-testid={`alert-item-${a.id}`}
                            >
                              <p className="font-semibold leading-tight">{a.text}</p>
                              <p className="text-[10px] opacity-60 mt-0.5">{a.ts.toLocaleTimeString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="theme-toggle-btn"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                  data-testid="user-menu-btn">
                  {user.profile_photo || user.logo ? (
                    <img src={`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo || user.logo}`}
                      className="w-7 h-7 rounded-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: brand }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-sm max-w-24 truncate">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50"
                    onMouseLeave={() => setDropdownOpen(false)}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <div className="p-2">
                      <Link to={dashboardPath} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-dashboard">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-profile">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/subscription" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-subscription">
                        <Settings className="w-4 h-4" /> Subscription
                      </Link>
                      <Link to="/messages" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-messages">
                        <MessageCircle className="w-4 h-4" /> Messages
                        {unreadMessages > 0 && <span className="ml-auto bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
                      </Link>
                      <Link to="/jobs-itinerary" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-jobs-itinerary">
                        <CalendarRange className="w-4 h-4" /> Jobs Itinerary
                      </Link>
                      <Link to="/help" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-help">
                        <HelpCircle className="w-4 h-4" /> Help Center
                      </Link>
                      <Link to="/pay-history" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-pay-history">
                        <DollarSign className="w-4 h-4" /> Pay History
                      </Link>
                      {["contractor","admin","superadmin"].includes(user.role) && (
                        <Link to="/archive" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-archive">
                          <Archive className="w-4 h-4" /> Job Archive
                        </Link>
                      )}
                      <Link to="/settings" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-white" data-testid="nav-app-settings">
                        <Sliders className="w-4 h-4" /> App Settings
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 mt-1" data-testid="nav-logout">
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !minimal && (
                <div className="flex items-center gap-3">
                  <Link to="/auth?mode=login" className="text-white hover:opacity-80 font-semibold text-sm transition-opacity" data-testid="nav-login">Log In</Link>
                  <Link to="/auth?mode=register" className="text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: brand }} data-testid="nav-signup">Sign Up</Link>
                </div>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="text-white/80 p-2 hover:text-white" data-testid="mobile-theme-toggle">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-2" data-testid="mobile-menu-btn">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-opacity-20 border-white px-4 pb-4 pt-2" style={{ backgroundColor: "var(--theme-nav-bg)" }}>
          {user ? (
            <>
              <div className="flex items-center gap-3 py-3 border-b border-white border-opacity-20 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: brand }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{user.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--theme-accent)" }}>{user.role}</p>
                </div>
              </div>
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm"><User className="w-4 h-4" /> Profile</Link>
              <Link to="/subscription" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm"><Settings className="w-4 h-4" /> Subscription</Link>
              <Link to="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm" data-testid="mobile-nav-messages">
                <MessageCircle className="w-4 h-4" /> Messages
                {unreadMessages > 0 && <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
              </Link>
              <Link to="/jobs-itinerary" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm" data-testid="mobile-nav-jobs-itinerary">
                <CalendarRange className="w-4 h-4" /> Jobs Itinerary
              </Link>
              <Link to="/pay-history" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm" data-testid="mobile-nav-pay-history"><DollarSign className="w-4 h-4" /> Pay History</Link>
              {["contractor","admin","superadmin"].includes(user.role) && (
                <Link to="/archive" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm" data-testid="mobile-nav-archive"><Archive className="w-4 h-4" /> Job Archive</Link>
              )}
              <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-white text-sm" data-testid="mobile-nav-app-settings">
                <Sliders className="w-4 h-4" /> App Settings
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-red-400 text-sm"><LogOut className="w-4 h-4" /> Log Out</button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/auth?mode=login" className="text-white font-semibold py-2">Log In</Link>
              <Link to="/auth?mode=register" className="text-white py-2 px-4 rounded-lg font-bold text-center" style={{ backgroundColor: brand }}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
