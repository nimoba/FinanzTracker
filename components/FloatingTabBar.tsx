import { useRouter } from 'next/router';

const tabs = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/finanzen/transaktionen', icon: '💳', label: 'Transaktionen' },
  { path: '/finanzen/konten', icon: '🏦', label: 'Konten' },
  { path: '/finanzen/budgets', icon: '📊', label: 'Budgets' },
  { path: '/finanzen/analysen', icon: '📈', label: 'Analysen' },
];

export default function FloatingTabBar() {
  const router = useRouter();

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e1e1e',
    borderTop: '1px solid #333',
    padding: '8px 0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    color: isActive ? '#36a2eb' : '#ccc',
    fontSize: 12,
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'color 0.2s ease',
  });

  const iconStyle: React.CSSProperties = {
    fontSize: 18,
    marginBottom: 4,
  };

  return (
    <div style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = router.pathname === tab.path;
        return (
          <div
            key={tab.path}
            style={tabStyle(isActive)}
            onClick={() => router.push(tab.path)}
          >
            <span style={iconStyle}>{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}