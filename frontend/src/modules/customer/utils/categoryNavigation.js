export const getCategoryLocation = (categoryId, extraState = {}) => {
  const selectedCategory = categoryId ?? "all";

  return {
    pathname: `/category/${encodeURIComponent(String(selectedCategory))}`,
    state: {
      selectedCategory,
      ...extraState,
    },
  };
};

export const navigateToCategory = (navigate, categoryId, extraState = {}) => {
  navigate(getCategoryLocation(categoryId, extraState));
};