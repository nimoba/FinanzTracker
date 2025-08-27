// Example: 3-Level Category Selector Component
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  typ: string;
  icon: string;
  farbe: string;
  parent_id: number | null;
  children?: Category[];
}

export function CategorySelector({ onSelect, selectedId, type }: {
  onSelect: (categoryId: number) => void;
  selectedId?: number;
  type: 'einnahme' | 'ausgabe';
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch categories with tree structure
    fetch(`/api/finanzen/kategorien?tree=true&typ=${type}`)
      .then(res => res.json())
      .then(setCategories);
  }, [type]);

  const renderCategoryOption = (category: Category, level: number = 0): JSX.Element[] => {
    const indent = '  '.repeat(level); // Indentation for visual hierarchy
    const elements: JSX.Element[] = [];

    // Add main category option
    elements.push(
      <option 
        key={category.id} 
        value={category.id}
        disabled={level === 0} // Main categories might be disabled for selection
      >
        {indent}{category.icon} {category.name}
      </option>
    );

    // Add subcategories recursively
    if (category.children) {
      category.children.forEach(child => {
        elements.push(...renderCategoryOption(child, level + 1));
      });
    }

    return elements;
  };

  return (
    <select 
      value={selectedId || ''}
      onChange={(e) => onSelect(parseInt(e.target.value))}
      className="border rounded px-3 py-2"
    >
      <option value="">Kategorie wählen...</option>
      {categories.map(category => 
        renderCategoryOption(category)
      )}
    </select>
  );
}

// Example of the hierarchy it would display:
/*
🛒 Lebensmittel (disabled - main category)
    🍽️ Restaurant
        🍕 Fast Food
        🍷 Fine Dining
        🥪 Casual Dining
    🏪 Supermarkt
        🥬 Frischprodukte
        🥫 Konserven
        🧽 Haushaltswaren
🚗 Transport (disabled - main category)
    ⛽ Benzin
    🚇 Öffentliche Verkehrsmittel
        🎫 Monatskarte
        🎟️ Einzelfahrt
*/