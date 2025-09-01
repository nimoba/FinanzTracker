import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

interface Account {
  id: number;
  name: string;
  typ: string;
  saldo: number;
  farbe: string;
}

interface AccountGaugeChartProps {
  accounts: Account[];
  title: string;
  historicalBalances?: Array<{month: string, balance: number}>;
}

export default function AccountGaugeChart({ accounts, title, historicalBalances }: AccountGaugeChartProps) {
  const totalBalance = accounts.reduce((sum, account) => {
    const saldo = typeof account.saldo === 'number' ? account.saldo : parseFloat(account.saldo) || 0;
    return sum + saldo;
  }, 0);

  // Calculate weighted average of last 3 months
  const calculateWeightedAverage = () => {
    if (!historicalBalances || historicalBalances.length === 0) {
      return 500; // Default base if no historical data
    }

    // Sort by month (newest first) and take last 3 months
    const sortedBalances = historicalBalances
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 3);

    if (sortedBalances.length === 0) return 500;

    // Weighted average: current month = 0.5, previous = 0.3, oldest = 0.2
    const weights = [0.5, 0.3, 0.2];
    let weightedSum = 0;
    let totalWeight = 0;

    sortedBalances.forEach((balance, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += balance.balance * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 500;
  };

  const baselineBalance = calculateWeightedAverage(); // This is the 50% mark
  const range = Math.max(Math.abs(baselineBalance) * 2, 1000); // Total range for the gauge
  const minValue = baselineBalance - range / 2; // Bottom of gauge
  const maxValue = baselineBalance + range / 2; // Top of gauge
  
  // Calculate progress (0 = bottom of gauge, 0.5 = baseline, 1 = top of gauge)
  const progress = Math.max(0, Math.min(1, (totalBalance - minValue) / range));
  const angle = progress * 180;
  
  const getProgressColor = (progress: number) => {
    if (progress >= 0.65) return '#27ae60'; // Well above baseline
    if (progress >= 0.55) return '#2ecc71'; // Above baseline
    if (progress >= 0.45) return '#f39c12'; // Around baseline
    if (progress >= 0.35) return '#e67e22'; // Below baseline
    return '#e74c3c'; // Well below baseline
  };

  // Create gauge data - show full semicircle with current position highlighted
  const currentPortion = progress;
  const remainingPortion = 1 - progress;
  
  const data = {
    labels: ['Aktueller Stand', 'Verbleibendes'],
    datasets: [
      {
        data: [currentPortion, remainingPortion],
        backgroundColor: [getProgressColor(progress), '#333333'],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
        borderRadius: 8,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#444',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(value);
          }
        }
      },
    },
  };

  const getBewertung = () => {
    const diffFromBaseline = totalBalance - baselineBalance;
    const percentDiff = baselineBalance !== 0 ? (diffFromBaseline / Math.abs(baselineBalance)) * 100 : 0;
    
    if (progress >= 0.65) return { 
      farbe: '#27ae60', 
      text: `Sehr gut! +${Math.round(percentDiff)}% 🎯` 
    };
    if (progress >= 0.55) return { 
      farbe: '#2ecc71', 
      text: `Über Durchschnitt +${Math.round(percentDiff)}% 💪` 
    };
    if (progress >= 0.45) return { 
      farbe: '#f39c12', 
      text: `Um Durchschnitt ${Math.round(Math.abs(percentDiff))}% 👍` 
    };
    if (progress >= 0.35) return { 
      farbe: '#e67e22', 
      text: `Unter Durchschnitt ${Math.round(Math.abs(percentDiff))}% ⚠️` 
    };
    return { 
      farbe: '#e74c3c', 
      text: `Deutlich unter Durchschnitt ${Math.round(Math.abs(percentDiff))}% 📉` 
    };
  };

  const bewertung = getBewertung();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 20,
      border: `2px solid ${bewertung.farbe}33`,
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <div>
          <h3 style={{
            color: '#fff',
            margin: 0,
            fontSize: 16,
            fontWeight: 'bold'
          }}>
            {title}
          </h3>
          <div style={{
            fontSize: 11,
            color: '#999',
            marginTop: 2
          }}>
            Durchschnitt 3 Monate: {formatCurrency(baselineBalance)}
          </div>
        </div>
        <span style={{
          fontSize: 12,
          color: bewertung.farbe,
          fontWeight: 'bold'
        }}>
          {bewertung.text}
        </span>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 280,
        aspectRatio: '2 / 1',
        margin: 'auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        <Doughnut key={`gauge-${accounts.map(a => a.id + '_' + a.saldo).join('-')}`} data={data} options={options} />
        
        <div style={{
          position: 'absolute',
          top: '70%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          zIndex: 2,
        }}>
          {formatCurrency(totalBalance)}
        </div>
        
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -100%) rotate(${angle + 270}deg)`,
            transformOrigin: 'center 100px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              transform: 'translateY(-28px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '8px solid #4da3ee',
                zIndex: 5,
              }}
            />
            <div
              style={{
                width: 3,
                height: 35,
                backgroundColor: '#4da3ee',
              }}
            />
          </div>
        </div>
      </div>

      {accounts.length > 0 && (
        <div style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center'
        }}>
          {accounts.map((account) => (
            <div
              key={account.id}
              style={{
                fontSize: 11,
                color: '#999',
                backgroundColor: '#333',
                padding: '4px 8px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: account.farbe
                }}
              />
              {account.name}: {formatCurrency(typeof account.saldo === 'number' ? account.saldo : parseFloat(account.saldo) || 0)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}