import React from "react";
import { useParams } from "react-router-dom";
import Home from "../Home/home.jsx";

const CategoryPage = () => {
  const { categoryId } = useParams();
  console.log("Category ID:", categoryId); // Debug xem có đúng không

  return <Home categoryId={categoryId} />;
};

export default CategoryPage;
