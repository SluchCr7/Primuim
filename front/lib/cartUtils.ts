export interface GuestCartItem {
  product: {
    _id: string;
    title: string;
    price: number;
    images?: Array<{ url: string }>;
    brand?: string;
    stock?: number;
    isDigital?: boolean;
  };
  quantity: number;
  price: number;
  variantSku?: string;
}

export const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("guest_cart");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error reading guest cart from localStorage:", err);
    return [];
  }
};

export const saveGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("guest_cart", JSON.stringify(items));
    // Trigger custom event to notify components (like Header)
    window.dispatchEvent(new Event("guest-cart-updated"));
  } catch (err) {
    console.error("Error writing guest cart to localStorage:", err);
  }
};

export interface GuestCartProduct {
  _id: string;
  title: string;
  price: number;
  images?: Array<{ url: string }>;
  brand?: string;
  stock?: number;
  isDigital?: boolean;
}

export const addGuestCartItem = (product: GuestCartProduct, quantity: number, variantSku?: string) => {
  const items = getGuestCart();
  const existingIndex = items.findIndex(
    (item) => item.product._id === product._id && item.variantSku === variantSku
  );

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({
      product: {
        _id: product._id,
        title: product.title,
        price: product.price,
        images: product.images,
        brand: product.brand,
        stock: product.stock,
        isDigital: product.isDigital,
      },
      quantity,
      price: product.price,
      variantSku,
    });
  }

  saveGuestCart(items);
};

export const updateGuestCartItemQuantity = (productId: string, quantity: number, variantSku?: string) => {
  const items = getGuestCart();
  const existingIndex = items.findIndex(
    (item) => item.product._id === productId && item.variantSku === variantSku
  );

  if (existingIndex > -1) {
    if (quantity <= 0) {
      items.splice(existingIndex, 1);
    } else {
      items[existingIndex].quantity = quantity;
    }
    saveGuestCart(items);
  }
};

export const removeGuestCartItem = (productId: string, variantSku?: string) => {
  const items = getGuestCart();
  const filtered = items.filter(
    (item) => !(item.product._id === productId && item.variantSku === variantSku)
  );
  saveGuestCart(filtered);
};

export const clearGuestCart = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("guest_cart");
  window.dispatchEvent(new Event("guest-cart-updated"));
};

export const getGuestCartTotals = () => {
  const items = getGuestCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  return { items, totalItems, totalPrice };
};
