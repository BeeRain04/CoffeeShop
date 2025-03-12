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
      const existingProduct = state.items.find((item) => item.id === product.id);

      if (existingProduct) {
        existingProduct.quantity += product.quantity || 1; // ✅ Mặc định số lượng nếu không có
      } else {
        state.items.push({ ...product, quantity: product.quantity || 1 }); // ✅ Đảm bảo có quantity
      }

      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
    },

    increaseQuantity: (state, action) => {
      const product = state.items.find(item => item.id === action.payload);
      if (product) {
        product.quantity += 1;
      }

      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
    },

    decreaseQuantity: (state, action) => {
      const product = state.items.find(item => item.id === action.payload);
      if (product) {
        if (product.quantity > 1) {
          product.quantity -= 1;
        } else {
          state.items = state.items.filter(item => item.id !== action.payload);
        }
      }

      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);

      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
    },
  },
});

export const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
