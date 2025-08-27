// Example migration to add third-level categories
// You could add this to your migrate.ts file

const thirdLevelCategories = [
  // Under Restaurant (Fast Food, Fine Dining, etc.)
  { name: 'McDonald\'s', parentName: 'Fast Food', icon: '🍟', farbe: '#f44336' },
  { name: 'Burger King', parentName: 'Fast Food', icon: '🍔', farbe: '#f44336' },
  { name: 'Subway', parentName: 'Fast Food', icon: '🥪', farbe: '#f44336' },
  
  { name: 'Gehobene Küche', parentName: 'Fine Dining', icon: '🍽️', farbe: '#f44336' },
  { name: 'Weinbar', parentName: 'Fine Dining', icon: '🍷', farbe: '#f44336' },
  
  // Under Supermarkt subcategories
  { name: 'Obst & Gemüse', parentName: 'Frischprodukte', icon: '🥕', farbe: '#f44336' },
  { name: 'Fleisch & Fisch', parentName: 'Frischprodukte', icon: '🥩', farbe: '#f44336' },
  { name: 'Milchprodukte', parentName: 'Frischprodukte', icon: '🥛', farbe: '#f44336' },
  
  { name: 'Dosengemüse', parentName: 'Konserven', icon: '🥫', farbe: '#f44336' },
  { name: 'Fertiggerichte', parentName: 'Konserven', icon: '🍱', farbe: '#f44336' },
  
  // Under Transport subcategories
  { name: 'Monatskarte', parentName: 'Öffentliche Verkehrsmittel', icon: '🎫', farbe: '#dc2626' },
  { name: 'Einzelfahrt', parentName: 'Öffentliche Verkehrsmittel', icon: '🎟️', farbe: '#dc2626' },
  
  { name: 'Super', parentName: 'Benzin', icon: '⛽', farbe: '#dc2626' },
  { name: 'Diesel', parentName: 'Benzin', icon: '⛽', farbe: '#dc2626' },
  
  // Under Entertainment subcategories  
  { name: 'PlayStation', parentName: 'Videospiele', icon: '🎮', farbe: '#9c27b0' },
  { name: 'Steam', parentName: 'Videospiele', icon: '💻', farbe: '#9c27b0' },
  
  { name: 'Netflix', parentName: 'Streaming', icon: '📺', farbe: '#9c27b0' },
  { name: 'Spotify', parentName: 'Streaming', icon: '🎵', farbe: '#9c27b0' },
  { name: 'YouTube Premium', parentName: 'Streaming', icon: '📱', farbe: '#9c27b0' },
];

// Migration logic to add third level
for (const thirdLevel of thirdLevelCategories) {
  // Find the subcategory (second level) that will be the parent
  const { rows: subcategoryRows } = await sql`
    SELECT id, typ FROM kategorien 
    WHERE name = ${thirdLevel.parentName} AND parent_id IS NOT NULL
  `;
  
  if (subcategoryRows.length > 0) {
    const subcategoryId = subcategoryRows[0].id;
    const categoryType = subcategoryRows[0].typ;
    
    // Check if third-level category already exists
    const { rows: existingRows } = await sql`
      SELECT id FROM kategorien 
      WHERE name = ${thirdLevel.name} AND parent_id = ${subcategoryId}
    `;

    if (existingRows.length === 0) {
      await sql`
        INSERT INTO kategorien (name, typ, icon, farbe, parent_id)
        VALUES (${thirdLevel.name}, ${categoryType}, ${thirdLevel.icon}, ${thirdLevel.farbe}, ${subcategoryId})
      `;
      console.log(`✅ Added third-level: ${thirdLevel.name} under ${thirdLevel.parentName}`);
    }
  }
}