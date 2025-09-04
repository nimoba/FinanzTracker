// pages/finanzen/portfolio/[id].tsx - Einzelposition Detail
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PositionDetail {
  id: number;
  name: string;
  symbol: string;
  wkn?: string;
  isin?: string;
  typ: string;
  waehrung: string;
  gehaltene_anteile: number;
  investiert: number;
  durchschnittspreis: number;
  aktueller_preis: number;
  aktueller_wert: number;
  gewinn: number;
  gewinn_prozent: number;
}

interface Transaction {
  id: number;
  typ: 'kauf' | 'verkauf';
  anzahl: number;
  preis: number;
  gebuehren: number;
  datum: string;
}

const TIME_PERIODS = [
  { key: 'today', label: 'Heute' },
  { key: '30d', label: '30T' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1J' },
  { key: '5y', label: '5J' },
  { key: 'all', label: 'Alle' }
];

export default function PositionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [position, setPosition] = useState<PositionDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  useEffect(() => {
    if (id) {
      loadPositionData();
      loadTransactions();
      loadChartData();
    }
  }, [id]);

  useEffect(() => {
    if (id && position) {
      loadChartData();
    }
  }, [selectedPeriod, position]);

  const loadPositionData = async () => {
    try {
      const response = await fetch(`/api/portfolio/positionen/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPosition(data);
      }
    } catch (error) {
      console.error('Error loading position:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch(`/api/portfolio/transaktionen?position_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadChartData = async () => {
    if (!position) return;
    
    try {
      const response = await fetch(
        `/api/portfolio/historical?symbol=${position.symbol}&wkn=${position.wkn}&period=${selectedPeriod}&type=${position.typ}`
      );
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartConfig = () => {
    return {
      data: {
        labels: chartData.map(point => point.date),
        datasets: [
          {
            label: 'Kurs',
            data: chartData.map(point => point.price),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
          }
        ]
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
              callback: (value: any) => `€${value.toFixed(2)}`
            }
          }
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
        <div style={{ color: 'white', fontSize: '18px' }}>Lade Position...</div>
      </div>
    );
  }

  if (!position) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Position nicht gefunden</div>
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
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>
              {position.name}
            </h1>
            <div style={{ color: '#9CA3AF', fontSize: '16px', marginTop: '4px' }}>
              {position.symbol} {position.wkn && `• WKN: ${position.wkn}`} {position.isin && `• ISIN: ${position.isin}`}
            </div>
          </div>
        </div>

        {/* Position Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
              Anteile
            </div>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
              {position.gehaltene_anteile.toFixed(4)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1F2937',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
              Aktueller Wert
            </div>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
              {formatCurrency(position.aktueller_wert)}
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
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
              {formatCurrency(position.investiert)}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>
              ⌀ {formatCurrency(position.durchschnittspreis)}
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
              color: position.gewinn >= 0 ? '#10B981' : '#EF4444',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {formatCurrency(position.gewinn)}
            </div>
            <div style={{ 
              color: position.gewinn >= 0 ? '#10B981' : '#EF4444',
              fontSize: '12px',
              marginTop: '2px'
            }}>
              {formatPercent(position.gewinn_prozent)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1F2937',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
              Aktueller Preis
            </div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
              {formatCurrency(position.aktueller_preis)}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>
              vs. ⌀ {formatCurrency(position.durchschnittspreis)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: 'white', fontSize: '20px', margin: 0 }}>
            Kursentwicklung
          </h2>

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

        <div style={{
          backgroundColor: '#1F2937',
          borderRadius: '12px',
          padding: '20px',
          height: '400px',
          marginBottom: '30px'
        }}>
          {chartData.length > 0 && (
            <Line {...getChartConfig()} />
          )}
        </div>

        {/* Transactions */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ color: 'white', fontSize: '20px', margin: 0 }}>
              Transaktionen
            </h2>
            <button
              onClick={() => setShowAddTransaction(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + Transaktion
            </button>
          </div>

          {transactions.length === 0 ? (
            <div style={{
              backgroundColor: '#1F2937',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '16px' }}>
                Noch keine Transaktionen vorhanden
              </div>
            </div>
          ) : (
            transactions.map(transaction => (
              <div
                key={transaction.id}
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        backgroundColor: transaction.typ === 'kauf' ? '#10B981' : '#EF4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {transaction.typ.toUpperCase()}
                      </div>
                      <div style={{ color: 'white', fontSize: '16px' }}>
                        {transaction.anzahl.toFixed(4)} Anteile
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
                        @ {formatCurrency(transaction.preis)}
                      </div>
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
                      {new Date(transaction.datum).toLocaleDateString('de-DE')}
                      {transaction.gebuehren > 0 && ` • Gebühren: ${formatCurrency(transaction.gebuehren)}`}
                    </div>
                  </div>
                  <div style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(transaction.anzahl * transaction.preis + transaction.gebuehren)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Modal - wird später vollständig implementiert */}
      {showAddTransaction && (
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
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Transaktion hinzufügen</h2>
            <p style={{ color: '#9CA3AF' }}>
              Transaktionsformular wird in der nächsten Implementierung erstellt...
            </p>
            <button
              onClick={() => setShowAddTransaction(false)}
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

// components/AddPositionForm.tsx
