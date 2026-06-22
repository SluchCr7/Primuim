"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetProductsQuery, useAddToCartMutation } from "../../lib/api";
import { Star, ShieldAlert, GitCompare, Trash2, ArrowRight } from "lucide-react";
import { useAppSelector } from "../../lib/store";
import { formatPrice as formatCurrencyPrice } from "../../lib/currencyUtils";

export default function ComparePage() {
  const { isAuthenticated, currency } = useAppSelector((state) => state.auth);
  const { data: productsData } = useGetProductsQuery({ limit: 12 });
  const [addToCart] = useAddToCartMutation();

  // Selected compare items in local state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("compare_list");
    if (saved) {
      try {
        setCompareIds(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const saveCompareList = (list: string[]) => {
    localStorage.setItem("compare_list", JSON.stringify(list));
    setCompareIds(list);
  };

  const handleRemoveCompare = (id: string) => {
    const filtered = compareIds.filter((item) => item !== id);
    saveCompareList(filtered);
  };

  const handleAddCompare = (id: string) => {
    if (compareIds.includes(id)) return;
    if (compareIds.length >= 3) {
      alert("You can compare up to 3 products side-by-side.");
      return;
    }
    saveCompareList([...compareIds, id]);
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to add items to your cart.");
      return;
    }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      alert("Product added to cart!");
    } catch (err) {
      alert("Failed to add to cart.");
    }
  };

  const availableProducts = productsData?.products || [];
  const comparedItems = availableProducts.filter((p: any) => compareIds.includes(p._id));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Compare Products", url: "/compare" }]} />

        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
            <GitCompare className="h-4 w-4" /> Attributes Matcher
          </span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Compare Designs</h1>
          <p className="text-sm text-muted mt-2">Evaluate specifications, pricing, and ratings side-by-side</p>
        </div>

        {/* SELECTOR DROPBOX */}
        <div className="mb-10 p-5 luxury-card bg-card-bg/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Select design to compare</span>
            <span className="text-xs text-muted font-light">Add up to 3 pieces side-by-side</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {availableProducts.slice(0, 6).map((p: any) => {
              const isAdded = compareIds.includes(p._id);
              return (
                <button
                  key={p._id}
                  onClick={() => (isAdded ? handleRemoveCompare(p._id) : handleAddCompare(p._id))}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${isAdded ? "bg-gold/10 border-gold text-gold" : "border-card-border hover:border-gold"}`}
                >
                  {isAdded ? `- ${p.title.substring(0, 15)}...` : `+ ${p.title.substring(0, 15)}...`}
                </button>
              );
            })}
          </div>
        </div>

        {comparedItems.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <GitCompare className="h-10 w-10 text-gold/30 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold">No items compared</h3>
            <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
              Add products from the selector bar above to evaluate attributes side-by-side.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse luxury-card">
              <thead>
                <tr className="border-b border-card-border bg-muted-light/30">
                  <th className="py-4 px-6 font-semibold w-1/4 uppercase tracking-wider text-xs text-muted">Specifications</th>
                  {comparedItems.map((item: any) => (
                    <th key={item._id} className="py-4 px-6 font-serif font-bold text-base w-1/4">
                      <div className="flex justify-between items-start">
                        <span className="line-clamp-2">{item.title}</span>
                        <button
                          onClick={() => handleRemoveCompare(item._id)}
                          className="text-muted hover:text-error ml-2 p-1 rounded hover:bg-error/10 transition-colors"
                          aria-label="Remove comparison"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {comparedItems.length < 3 && (
                    <th className="py-4 px-6 text-center text-xs text-muted/40 font-light border-l border-card-border">
                      Slot available
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Image Row */}
                <tr className="border-b border-card-border">
                  <td className="py-4 px-6 font-semibold text-xs text-muted uppercase tracking-wider">Preview</td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-4 px-6">
                      <img
                        src={item.images?.[0]?.url || "https://placehold.co/150x150"}
                        alt={item.title}
                        className="h-28 w-28 object-cover rounded border border-card-border"
                      />
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>

                {/* Price Row */}
                <tr className="border-b border-card-border">
                  <td className="py-4 px-6 font-semibold text-xs text-muted uppercase tracking-wider">Price</td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-4 px-6 font-bold text-gold text-base">
                      {formatCurrencyPrice(item.price, currency)}
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>

                {/* Brand Row */}
                <tr className="border-b border-card-border">
                  <td className="py-4 px-6 font-semibold text-xs text-muted uppercase tracking-wider">Designer Brand</td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-4 px-6 font-medium text-xs uppercase tracking-widest text-foreground">
                      {item.brand || "Designer House"}
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>

                {/* Rating Row */}
                <tr className="border-b border-card-border">
                  <td className="py-4 px-6 font-semibold text-xs text-muted uppercase tracking-wider">User Reviews</td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="font-semibold text-sm">{item.ratingAverage || 5.0}</span>
                        <span className="text-xs text-muted font-light">({item.ratingCount || 0} reviews)</span>
                      </div>
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>

                {/* Stock Row */}
                <tr className="border-b border-card-border">
                  <td className="py-4 px-6 font-semibold text-xs text-muted uppercase tracking-wider">Availability</td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-4 px-6 text-xs">
                      {item.stock > 0 ? (
                        <span className="text-success font-semibold">In stock ({item.stock} reserved)</span>
                      ) : (
                        <span className="text-error font-semibold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Allocated</span>
                      )}
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>

                {/* Buy Button Row */}
                <tr>
                  <td className="py-4 px-6"></td>
                  {comparedItems.map((item: any) => (
                    <td key={item._id} className="py-6 px-6">
                      <button
                        onClick={() => handleAddToCart(item._id)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white text-xs font-semibold uppercase tracking-wider px-4 transition-all"
                      >
                        Reserve bag <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  ))}
                  {comparedItems.length < 3 && <td className="py-4 px-6 bg-muted-light/5 border-l border-card-border"></td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
