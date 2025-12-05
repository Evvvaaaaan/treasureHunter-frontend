import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, MessageCircle, User } from "lucide-react";
import { useChat } from "../components/ChatContext" 
import "../styles/bottom-navigation.css";

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnreadCount } = useChat(); // [추가] Context에서 읽지 않은 메시지 수 가져오기

  const navItems = [
    { path: "/home", icon: Home, label: "홈" },
    { path: "/map", icon: Map, label: "지도" },
    // [수정] badge 값을 Context 값으로 연결
    { path: "/chat-list", icon: MessageCircle, label: "메시지", badge: totalUnreadCount },
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
              {/* badge가 0보다 클 때만 표시 */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}