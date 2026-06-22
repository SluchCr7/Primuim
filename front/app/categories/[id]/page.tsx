"use client";

import React from "react";
import { useParams } from "next/navigation";
import CategoryView from "../../components/CategoryView";

export default function CategoryDetailPage() {
  const { id } = useParams();

  return <CategoryView id={id as string} />;
}
