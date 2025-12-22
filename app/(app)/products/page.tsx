"use client";

import { useState } from "react";
import { ShopifyPageLayout } from "@/components/layout/ShopifyPageLayout";
import {
  ShopifyButton,
  ShopifyCard,
  ShopifyEmptyState,
  ShopifySectionHeader,
} from "@/components/ui/shopify";
import {
  Plus,
  Import,
  Search,
  Filter,
  MoreVertical,
  Image as ImageIcon,
  Package,
  Archive,
  Duplicate,
  Trash2,
} from "lucide-react";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <ShopifyPageLayout title="Products" subtitle="Manage your product catalog">
      <div className="shopify-page-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--shopify-border-focus)]"
              />
            </div>
            
            {/* Filters */}
            <ShopifyButton
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="w-4 h-4" />}
            >
              Filters
            </ShopifyButton>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <ShopifyButton
              variant="secondary"
              icon={<Import className="w-4 h-4" />}
            >
              Import
            </ShopifyButton>
            <ShopifyButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add product
            </ShopifyButton>
          </div>
        </div>

        {/* Filter Bar (shown when filters are active) */}
        {showFilters && (
          <ShopifyCard className="mb-6" padding="md">
            <div className="flex items-center gap-4">
              <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                <option>All products</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
              <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                <option>All vendors</option>
              </select>
              <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                <option>All product types</option>
              </select>
              <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                <option>All collections</option>
              </select>
            </div>
          </ShopifyCard>
        )}

        {/* Products List */}
        <ShopifyCard>
          {/* Empty State when no products */}
          <ShopifyEmptyState
            heading="Add your products"
            description="Add the products you want to sell on your online store."
            image={
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            }
            primaryAction={{
              content: "Add product",
              onAction: () => console.log("Add product clicked"),
            }}
            secondaryAction={{
              content: "Import",
              onAction: () => console.log("Import clicked"),
            }}
          />

          {/* Product sourcing section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <ShopifySectionHeader title="Find products to sell" />
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[ImageIcon, Package, Archive].map((Icon, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                    >
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Browse product sourcing apps</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Find and sell products from third-party suppliers
                  </p>
                </div>
                <ShopifyButton variant="secondary">
                  Browse apps
                </ShopifyButton>
              </div>
            </div>
          </div>
        </ShopifyCard>

        {/* Sample Product Grid (when products exist) */}
        {/* Uncomment when you have products to display */}
        {/*
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ShopifyCard key={product.id} padding="md">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{product.price}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-700' :
                      product.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-gray-500">{product.inventory} in stock</span>
                    {product.inventory < 10 && (
                      <span className="text-xs text-amber-600">Low stock</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </ShopifyCard>
          ))}
        </div>
        */}
      </div>
    </ShopifyPageLayout>
  );
}
