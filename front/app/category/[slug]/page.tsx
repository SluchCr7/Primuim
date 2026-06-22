"use client";

import React from "react";
import { useParams } from "next/navigation";
import CategoryView from "../../components/CategoryView";

export default function CategoryDetailPage() {
  const { slug } = useParams();

  return <CategoryView slug={slug as string} />;
}
