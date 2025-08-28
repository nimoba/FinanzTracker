import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Category {
  id: number;
  name: string;
  typ: 'einnahme' | 'ausgabe';
  icon: string;
  farbe: string;
  parent_id?: number;
  parent_name?: string;
  level?: number;
  grandparent_name?: string;
}

interface CategoryFormData {
  name: string;
  typ: 'einnahme' | 'ausgabe';
  icon: string;
  farbe: string;
  parent_id: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    typ: 'ausgabe',
    icon: '💰',
    farbe: '#36a2eb',
    parent_id: ''
  });

  const router = useRouter();

  const colors = [
    '#36a2eb', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#8bc34a', '#ffeb3b'
  ];

  const icons = [
    '💰', '🏦', '🛒', '🏠', '🚗', '⚕️', '🎬', '👕', '📚', '🛡️', '📱', '💸',
    '💼', '💻', '🎁', '🎮', '🎭', '🍺', '📺', '🏪', '🍽️', '☕', '🥡',
    '🚇', '⛽', '🚕', '🅿️', '🎯', '⏰', '👔', '👟'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/finanzen/kategorien');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const isEditing = !!editingCategory;
    const url = '/api/finanzen/kategorien';
    const method = isEditing ? 'PUT' : 'POST';
    const body = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      ...(isEditing && { id: editingCategory.id })
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadCategories();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      typ: category.typ,
      icon: category.icon,
      farbe: category.farbe,
      parent_id: category.parent_id ? category.parent_id.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Kategorie wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/finanzen/kategorien?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      typ: 'ausgabe',
      icon: '💰',
      farbe: '#36a2eb',
      parent_id: ''
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#2c2c2c",
    minHeight: "100vh",
    color: "#ffffff",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #333',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const subcategoryStyle: React.CSSProperties = {
    ...cardStyle,
    marginLeft: '32px',
    backgroundColor: '#252525',
    border: '1px solid #444',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#36a2eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    marginLeft: '8px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #555',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginBottom: '16px',
    width: '100%',
  };

  // Group categories by level
  const level1Categories = categories.filter(cat => cat.level === 1 || (!cat.parent_id && !cat.level));
  const level2Categories = categories.filter(cat => cat.level === 2 || (cat.parent_id && !cat.grandparent_name));
  const level3Categories = categories.filter(cat => cat.level === 3 || (cat.parent_id && cat.grandparent_name));
  
  const getLevel2Categories = (level1Id: number) => 
    level2Categories.filter(cat => cat.parent_id === level1Id);
  const getLevel3Categories = (level2Id: number) => 
    level3Categories.filter(cat => cat.parent_id === level2Id);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginTop: 100 }}>Laden...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>🏷️ Kategorien verwalten</h1>
        <div>
          <button 
            onClick={() => setShowForm(true)}
            style={buttonStyle}
          >
            + Neue Kategorie
          </button>
          <button 
            onClick={() => router.push('/')}
            style={{ ...buttonStyle, backgroundColor: '#666', marginLeft: '8px' }}
          >
            ← Zurück
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h2 style={{ color: '#22c55e', marginBottom: '16px' }}>💰 Einnahmen</h2>
          {level1Categories
            .filter(cat => cat.typ === 'einnahme')
            .map(level1 => (
              <div key={level1.id}>
                {/* Level 1 Category */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>
                      {level1.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{level1.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Level 1 - {getLevel2Categories(level1.id).length} Unterkategorien
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleEdit(level1)}
                      style={buttonStyle}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(level1.id)}
                      style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {/* Level 2 Categories */}
                {getLevel2Categories(level1.id).map(level2 => (
                  <div key={level2.id}>
                    <div style={subcategoryStyle}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '12px' }}>↳</span>
                        <span style={{ fontSize: '16px', marginRight: '8px' }}>
                          {level2.icon}
                        </span>
                        <div>
                          <span>{level2.name}</span>
                          <div style={{ fontSize: '10px', color: '#999' }}>
                            Level 2 - {getLevel3Categories(level2.id).length} Details
                          </div>
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => handleEdit(level2)}
                          style={buttonStyle}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(level2.id)}
                          style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>

                    {/* Level 3 Categories */}
                    {getLevel3Categories(level2.id).map(level3 => (
                      <div key={level3.id} style={{
                        ...subcategoryStyle,
                        marginLeft: '64px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #555',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '12px' }}>↳↳</span>
                          <span style={{ fontSize: '14px', marginRight: '8px' }}>
                            {level3.icon}
                          </span>
                          <div>
                            <span>{level3.name}</span>
                            <div style={{ fontSize: '10px', color: '#999' }}>
                              Level 3
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => handleEdit(level3)}
                            style={{ ...buttonStyle, fontSize: '12px', padding: '6px 8px' }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDelete(level3.id)}
                            style={{ ...buttonStyle, backgroundColor: '#f44336', fontSize: '12px', padding: '6px 8px' }}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
        </div>

        <div>
          <h2 style={{ color: '#f44336', marginBottom: '16px' }}>💸 Ausgaben</h2>
          {level1Categories
            .filter(cat => cat.typ === 'ausgabe')
            .map(level1 => (
              <div key={level1.id}>
                {/* Level 1 Category */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>
                      {level1.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{level1.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Level 1 - {getLevel2Categories(level1.id).length} Unterkategorien
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleEdit(level1)}
                      style={buttonStyle}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(level1.id)}
                      style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {/* Level 2 Categories */}
                {getLevel2Categories(level1.id).map(level2 => (
                  <div key={level2.id}>
                    <div style={subcategoryStyle}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '12px' }}>↳</span>
                        <span style={{ fontSize: '16px', marginRight: '8px' }}>
                          {level2.icon}
                        </span>
                        <div>
                          <span>{level2.name}</span>
                          <div style={{ fontSize: '10px', color: '#999' }}>
                            Level 2 - {getLevel3Categories(level2.id).length} Details
                          </div>
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => handleEdit(level2)}
                          style={buttonStyle}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(level2.id)}
                          style={{ ...buttonStyle, backgroundColor: '#f44336' }}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>

                    {/* Level 3 Categories */}
                    {getLevel3Categories(level2.id).map(level3 => (
                      <div key={level3.id} style={{
                        ...subcategoryStyle,
                        marginLeft: '64px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #555',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '12px' }}>↳↳</span>
                          <span style={{ fontSize: '14px', marginRight: '8px' }}>
                            {level3.icon}
                          </span>
                          <div>
                            <span>{level3.name}</span>
                            <div style={{ fontSize: '10px', color: '#999' }}>
                              Level 3
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => handleEdit(level3)}
                            style={{ ...buttonStyle, fontSize: '12px', padding: '6px 8px' }}
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDelete(level3.id)}
                            style={{ ...buttonStyle, backgroundColor: '#f44336', fontSize: '12px', padding: '6px 8px' }}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ marginBottom: '24px' }}>
              {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'}
            </h2>

            <input
              type="text"
              placeholder="Kategoriename"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              required
            />

            <select
              value={formData.typ}
              onChange={(e) => setFormData({ ...formData, typ: e.target.value as 'einnahme' | 'ausgabe' })}
              style={inputStyle}
            >
              <option value="ausgabe">Ausgabe</option>
              <option value="einnahme">Einnahme</option>
            </select>

            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">Hauptkategorie (Level 1)</option>
              {level1Categories
                .filter(cat => cat.typ === formData.typ)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name} (Level 1)
                  </option>
                ))}
              {level2Categories
                .filter(cat => cat.typ === formData.typ)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    ↳ {category.icon} {category.name} (Level 2)
                  </option>
                ))}
            </select>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Icon:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
                {icons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: '8px',
                      fontSize: '18px',
                      border: formData.icon === icon ? '2px solid #36a2eb' : '1px solid #555',
                      backgroundColor: formData.icon === icon ? '#2a2a2a' : '#1a1a1a',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Farbe:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, farbe: color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: color,
                      border: formData.farbe === color ? '3px solid #fff' : '1px solid #555',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{ ...buttonStyle, backgroundColor: '#666' }}
              >
                Abbrechen
              </button>
              <button type="submit" style={buttonStyle}>
                {editingCategory ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}