// pages/finanzen/portfolio.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import FloatingTabBar from '@/components/FloatingTabBar';
import PortfolioTransferForm from '@/components/PortfolioTransferForm';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Position {
  id: number;
  name: string;
  symbol: string;
  typ: string;
  shares: number;
  currentPrice: number;
  currentValue: number;
  invested: number;
  gain: number;
  gainPercent: number;
  weight: number;
}

interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashValue: number;
  positionsValue: number;
  positions: Position[];
}

interface ChartDataPoint {
  date: string;
  value: number;
  invested?: number;
}

const TIME_PERIODS = [
  { key: 'today', label: 'Heute', days: 1 },
  { key: '30d', label: '30T', days: 30 },
  { key: '6m', label: '6M', days: 180 },
  { key: '1y', label: '1J', days: 365 },
  { key: '5y', label: '5J', days: 1825 },
  { key: 'all', label: 'Alle', days: null }
];

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [chartType, setChartType] = useState<'performance' | 'value'>('performance');
  const [loading, setLoading] = useState(true);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAddPositionForm, setShowAddPositionForm] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);


  useEffect(() => {
    loadPortfolioData();
    loadChartData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [selectedPeriod, chartType]);

  const loadPortfolioData = async () => {
    try {
      const response = await fetch('/api/portfolio/overview');
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Hier würdest du historische Portfolio-Daten laden
      // Für jetzt simulieren wir die Daten
      const mockData: ChartDataPoint[] = [];
      const startDate = new Date();
      const days = TIME_PERIODS.find(p => p.key === selectedPeriod)?.days || 365;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(startDate);
        date.setDate(date.getDate() - i);
        
        // Simulierte Daten - ersetze durch echte API-Calls
        const baseValue = 10000;
        const volatility = Math.sin(i / 10) * 500 + Math.random() * 200;
        const trend = (days - i) * 2;
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          value: baseValue + trend + volatility,
          invested: baseValue + (days - i) * 1.5 // Simulierte Einzahlungen
        });
      }
      
      setChartData(mockData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartConfig = () => {
    const isPerformance = chartType === 'performance';
    
    const datasets = [
      {
        label: isPerformance ? 'Performance' : 'Portfoliowert',
        data: chartData.map(point => ({
          x: point.date,
          y: isPerformance ? 
            ((point.value - (point.invested || point.value)) / (point.invested || point.value)) * 100 :
            point.value
        })),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ];

    if (!isPerformance && chartData.some(p => p.invested)) {
      datasets.push({
        label: 'Investiert',
        data: chartData.map(point => ({
          x: point.date,
          y: point.invested || 0
        })),
        borderColor: '#6B7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        fill: false,
        tension: 0.4,
      });
    }

    // WICHTIG: Chart.js braucht { data: ..., options: ... } Struktur
    return {
      data: {
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#D1D5DB' }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#D1D5DB',
            borderColor: '#374151',
            borderWidth: 1,
          }
        },
        scales: {
          x: {
            grid: { color: '#374151' },
            ticks: { color: '#9CA3AF' }
          },
          y: {
            grid: { color: '#374151' },
            ticks: { 
              color: '#9CA3AF',
              callback: (value: any) => {
                return isPerformance ? `${value.toFixed(2)}%` : `€${value.toLocaleString()}`;
              }
            }
          }
        },
        interaction: {
          intersect: false,
        }
      }
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#111827', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Lade Portfolio...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>Portfolio</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowTransferForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              💰 Geld einzahlen
            </button>
            <button
              onClick={() => setShowAddPositionForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + Position
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        {portfolioData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: '#1F2937',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
                Gesamtwert
              </div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                {formatCurrency(portfolioData.totalValue)}
              </div>
            </div>

            <div style={{
              backgroundColor: '#1F2937',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
                Gewinn/Verlust
              </div>
              <div style={{ 
                color: portfolioData.totalGain >= 0 ? '#10B981' : '#EF4444', 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>
                {formatCurrency(portfolioData.totalGain)} ({formatPercent(portfolioData.totalGainPercent)})
              </div>
            </div>

            <div style={{
              backgroundColor: '#1F2937',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
                Cash
              </div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                {formatCurrency(portfolioData.cashValue)}
              </div>
            </div>

            <div style={{
              backgroundColor: '#1F2937',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
                Investiert
              </div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                {formatCurrency(portfolioData.totalInvested)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          {/* Chart Type Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#1F2937',
            borderRadius: '8px',
            padding: '4px'
          }}>
            {[
              { key: 'performance', label: 'Performance' },
              { key: 'value', label: 'Portfoliowert' }
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setChartType(type.key as 'performance' | 'value')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: chartType === type.key ? '#10B981' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Time Period Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: '#1F2937',
            borderRadius: '8px',
            padding: '4px',
            gap: '2px'
          }}>
            {TIME_PERIODS.map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedPeriod === period.key ? '#10B981' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{
          backgroundColor: '#1F2937',
          borderRadius: '12px',
          padding: '20px',
          height: '400px',
          marginBottom: '30px'
        }}>
          {chartData.length > 0 && (
            <Line data={getChartConfig().data} options={getChartConfig().options} />
          )}
        </div>

{/* Positions List - KOMPLETT ERSETZEN */}
        <div>
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>
            Positionen
          </h2>

          {portfolioData?.positions.length === 0 && (
            <div style={{
              backgroundColor: '#1F2937',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '16px' }}>
                Noch keine Positionen vorhanden
              </div>
              <button
                onClick={() => setShowAddPositionForm(true)}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Erste Position hinzufügen
              </button>
            </div>
          )}

          {portfolioData?.positions.map((position, index) => (
            <div
              key={position.id}
              onClick={() => router.push(`/finanzen/portfolio/${position.id}`)}
              onMouseEnter={() => setHoveredPosition(index)}
              onMouseLeave={() => setHoveredPosition(null)}
              style={{
                backgroundColor: hoveredPosition === index ? '#374151' : '#1F2937',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {position.name}
                    </div>
                    <div style={{
                      backgroundColor: '#374151',
                      color: '#9CA3AF',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {position.symbol}
                    </div>
                    <div style={{
                      backgroundColor: position.typ === 'stock' ? '#3B82F6' : 
                                     position.typ === 'etf' ? '#10B981' : '#F59E0B',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {position.typ.toUpperCase()}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '16px',
                    color: '#9CA3AF',
                    fontSize: '14px'
                  }}>
                    <div>
                      <div>Anteile: {position.shares.toFixed(4)}</div>
                      <div>Gewichtung: {position.weight.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div>Preis: {formatCurrency(position.currentPrice)}</div>
                      <div>Wert: {formatCurrency(position.currentValue)}</div>
                    </div>
                    <div>
                      <div>Investiert: {formatCurrency(position.invested)}</div>
                      <div style={{ 
                        color: position.gain >= 0 ? '#10B981' : '#EF4444',
                        fontWeight: 'bold'
                      }}>
                        {formatCurrency(position.gain)} ({formatPercent(position.gainPercent)})
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  color: '#9CA3AF',
                  fontSize: '20px',
                  marginLeft: '16px'
                }}>
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Tab Bar */}
      <FloatingTabBar />

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <PortfolioTransferForm
          onSuccess={() => {
            loadPortfolioData();
            loadChartData();
          }}
          onClose={() => setShowTransferForm(false)}
        />
      )}

      {/* Add Position Form Modal - wird später implementiert */}
      {showAddPositionForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
          }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Position hinzufügen</h2>
            <p style={{ color: '#9CA3AF' }}>
              Formular wird in der nächsten Implementierung erstellt...
            </p>
            <button
              onClick={() => setShowAddPositionForm(false)}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}