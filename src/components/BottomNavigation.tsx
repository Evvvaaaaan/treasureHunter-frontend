import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, MessageCircle, User } from "lucide-react";
import "../styles/bottom-navigation.css";

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/home", icon: Home, label: "홈" },
    { path: "/map", icon: Map, label: "지도" },
    { path: "/chat-list", icon: MessageCircle, label: "메시지", badge: 1},
    { path: "/profile", icon: User, label: "프로필" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === "/chat-list" && location.pathname.startsWith("/chat"));
  };

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item ${active ? "active" : ""}`}
            aria-label={item.label}
          >
            <div className="nav-icon-wrapper">
              <Icon className="nav-icon" size={22} />
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}