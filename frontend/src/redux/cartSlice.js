import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    totalQuantity: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existingProduct = state.items.find(item => item.productId === product.productId);
    
      if (existingProduct) {
        existingProduct.quantity += product.quantity || 1; // ✅ Cộng dồn đúng số lượng
      } else {
        state.items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: product.quantity || 1  // ✅ Lấy số lượng từ payload
        });
      }
    
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
    },

    increaseQuantity: (state, action) => {
      const product = state.items.find(item => item.productId === action.payload);
      if (product) {
        product.quantity += 1;
      }
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0); // ✅ Cập nhật tổng số lượng
    },

    decreaseQuantity: (state, action) => {
      const product = state.items.find(item => item.productId === action.payload);
      if (product && product.quantity > 1) {
        product.quantity -= 1;
      }
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0); // ✅ Cập nhật tổng số lượng
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0); // ✅ Cập nhật tổng số lượng
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
    },
  },
});

export const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

