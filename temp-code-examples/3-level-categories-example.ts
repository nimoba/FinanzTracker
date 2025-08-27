// Example: Enhanced API for 3-level category support
// Add this function to your kategorien.ts API

// Helper function to build category hierarchy
function buildCategoryTree(categories: any[]) {
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const categoryWithChildren = categoryMap.get(cat.id);
    
    if (cat.parent_id === null) {
      // Root level category
      rootCategories.push(categoryWithChildren);
    } else {
      // Child category - add to parent's children
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    }
  });

  return rootCategories;
}

// Example usage in GET handler:
if (req.query.tree === 'true') {
  const { rows } = await sql`
    SELECT k.*, p.name as parent_name 
    FROM kategorien k 
    LEFT JOIN kategorien p ON k.parent_id = p.id 
    ORDER BY COALESCE(p.name, k.name), k.parent_id NULLS FIRST, k.name
  `;
  
  const tree = buildCategoryTree(rows);
  return res.status(200).json(tree);
}