interface StatsCardProps {
  icon: string;
  title: string;
  value: string;
  trend?: number;
  color?: string;
  subtitle?: string;
}

export default function StatsCard({ icon, title, value, trend, color = '#36a2eb', subtitle }: StatsCardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #333',
    marginBottom: 16,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 24,
    marginRight: 12,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#ccc',
    margin: 0,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 'bold',
    color: color,
    margin: '8px 0',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#999',
  };

  const trendStyle: React.CSSProperties = {
    fontSize: 12,
    color: trend && trend > 0 ? '#22c55e' : trend && trend < 0 ? '#f44336' : '#ccc',
    marginTop: 4,
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={iconStyle}>{icon}</span>
        <h3 style={titleStyle}>{title}</h3>
      </div>
      <div style={valueStyle}>{value}</div>
      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
      {trend !== undefined && (
        <div style={trendStyle}>
          {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}