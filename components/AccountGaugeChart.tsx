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
  targetAmount?: number;
}

export default function AccountGaugeChart({ accounts, title, targetAmount }: AccountGaugeChartProps) {
  const totalBalance = accounts.reduce((sum, account) => {
    const saldo = typeof account.saldo === 'number' ? account.saldo : parseFloat(account.saldo) || 0;
    return sum + saldo;
  }, 0);
  const target = targetAmount || Math.max(Math.abs(totalBalance) * 1.5, 1000);
  const absBalance = Math.abs(totalBalance);
  const progress = target > 0 ? Math.min(absBalance / target, 1) : 0;
  const angle = progress * 180;
  
  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return '#27ae60';
    if (progress >= 0.6) return '#2ecc71';
    if (progress >= 0.4) return '#f39c12';
    return '#e74c3c';
  };

  const remaining = Math.max(target - absBalance, 0);
  
  const data = {
    labels: ['Aktueller Stand', 'Bis Ziel'],
    datasets: [
      {
        data: [absBalance, remaining],
        backgroundColor: [getProgressColor(progress), '#e0e0e0'],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
        borderRadius: 10,
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
    const isPositive = totalBalance >= 0;
    if (!isPositive) {
      return { farbe: '#e74c3c', text: 'Schulden! ⚠️' };
    }
    
    if (progress >= 0.9) return { farbe: '#27ae60', text: 'Ausgezeichnet! 🎯' };
    if (progress >= 0.7) return { farbe: '#2ecc71', text: 'Sehr gut! 💪' };
    if (progress >= 0.5) return { farbe: '#f39c12', text: 'Gut! 👍' };
    return { farbe: '#e74c3c', text: 'Ausbaubar 📈' };
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
        <h3 style={{
          color: '#fff',
          margin: 0,
          fontSize: 16,
          fontWeight: 'bold'
        }}>
          {title}
        </h3>
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