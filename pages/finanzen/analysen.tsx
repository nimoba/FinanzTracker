import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import FloatingTabBar from '@/components/FloatingTabBar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

interface MonthlyData {
  monat: string;
  einnahmen: number;
  ausgaben: number;
}

interface CategoryData {
  kategorie: string;
  betrag: number;
  farbe: string;
  icon: string;
  anzahl_transaktionen: number;
}

export default function AnalysisPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  useEffect(() => {
    loadCategoryData();
  }, [dateRange]);

  const loadAnalysisData = async () => {
    try {
      const response = await fetch('/api/finanzen/analysen?type=overview');
      const data = await response.json();
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async () => {
    try {
      const params = new URLSearchParams({
        type: 'categories',
        from: dateRange.from,
        to: dateRange.to
      });
      
      const response = await fetch(`/api/finanzen/analysen?${params}`);
      const data = await response.json();
      setCategoryData(data);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: 'short',
      year: '2-digit'
    });
  };

  // Monthly Income vs Expenses Chart
  const lineChartData = {
    labels: monthlyData.map(item => formatMonth(item.monat)),
    datasets: [
      {
        label: 'Einnahmen',
        data: monthlyData.map(item => item.einnahmen),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Ausgaben',
        data: monthlyData.map(item => item.ausgaben),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        text: 'Einnahmen vs. Ausgaben (12 Monate)',
        color: '#ffffff',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cccccc',
        },
        grid: {
          color: '#333333',
        },
      },
      y: {
        ticks: {
          color: '#cccccc',
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
        grid: {
          color: '#333333',
        },
      },
    },
  };

  // Category Spending Pie Chart
  const pieChartData = {
    labels: categoryData.map(item => item.kategorie),
    datasets: [
      {
        data: categoryData.map(item => item.betrag),
        backgroundColor: categoryData.map(item => item.farbe),
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Ausgaben nach Kategorien',
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
    paddingBottom: "100px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  };

  const chartContainerStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #333',
    marginBottom: 24,
  };

  const dateRangeStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    padding: 12,
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  };

  const summaryGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 16,
    marginBottom: 24,
  };

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #333',
    textAlign: 'center',
  };

  const categoryListStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    border: '1px solid #333',
  };

  const categoryItemStyle: React.CSSProperties = {
    padding: 16,
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const totalSpent = categoryData.reduce((sum, item) => sum + item.betrag, 0);
  const avgPerCategory = categoryData.length > 0 ? totalSpent / categoryData.length : 0;

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Laden...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>📈 Analysen</h1>

      {/* Date Range Selector */}
      <div style={dateRangeStyle}>
        <label style={{ color: '#ccc' }}>Zeitraum für Kategorien:</label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          style={inputStyle}
        />
        <span style={{ color: '#ccc' }}>bis</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          style={inputStyle}
        />
      </div>

      {/* Summary Cards */}
      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <h3 style={{ margin: 0, marginBottom: 8, color: '#ccc' }}>Gesamtausgaben</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f44336' }}>
            {formatCurrency(totalSpent)}
          </div>
        </div>
        <div style={summaryCardStyle}>
          <h3 style={{ margin: 0, marginBottom: 8, color: '#ccc' }}>Durchschnitt pro Kategorie</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#36a2eb' }}>
            {formatCurrency(avgPerCategory)}
          </div>
        </div>
        <div style={summaryCardStyle}>
          <h3 style={{ margin: 0, marginBottom: 8, color: '#ccc' }}>Aktive Kategorien</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e' }}>
            {categoryData.length}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyData.length > 0 && (
        <div style={chartContainerStyle}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      )}

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Pie Chart */}
          <div style={chartContainerStyle}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>

          {/* Category List */}
          <div>
            <h3 style={{ marginBottom: 16 }}>Top Kategorien</h3>
            <div style={categoryListStyle}>
              {categoryData
                .sort((a, b) => b.betrag - a.betrag)
                .slice(0, 10)
                .map((category, index) => (
                  <div 
                    key={category.kategorie} 
                    style={{
                      ...categoryItemStyle,
                      borderBottom: index === Math.min(9, categoryData.length - 1) ? 'none' : '1px solid #333'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 20, marginRight: 12 }}>
                        {category.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {category.kategorie}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {category.anzahl_transaktionen} Transaktionen
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#f44336' }}>
                      {formatCurrency(category.betrag)}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {monthlyData.length === 0 && categoryData.length === 0 && (
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          padding: 40, 
          textAlign: 'center', 
          borderRadius: 12,
          border: '1px solid #333',
          color: '#999'
        }}>
          Noch keine Daten für Analysen vorhanden
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}