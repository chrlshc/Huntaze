"use client";

import { Hero } from "@/components/sections/marketing/Hero";
import { UnifiedPlatform } from "@/components/sections/marketing/UnifiedPlatform";
import { ForEveryone } from "@/components/sections/marketing/ForEveryone";
import { SellEverywhere } from "@/components/sections/marketing/SellEverywhere";
import { FindCustomers } from "@/components/sections/marketing/FindCustomers";
import { GrowGlobally } from "@/components/sections/marketing/GrowGlobally";
import { ManageBusiness } from "@/components/sections/marketing/ManageBusiness";
import { PerformanceInnovation } from "@/components/sections/marketing/PerformanceInnovation";
import { SupportFinancing } from "@/components/sections/marketing/SupportFinancing";
import { QuickStart } from "@/components/sections/marketing/QuickStart";
import MobileAnchorNav from "@/components/sections/marketing/MobileAnchorNav";

export default function HomePage() {
  return (
    <>
      {/* Page 1: Hero - Be the next big thing */}
      <Hero />
      <MobileAnchorNav />
      
      {/* Page 2: The one platform behind it all */}
      <UnifiedPlatform />
      
      {/* Page 3: For everyone from beginners to top 1% */}
      <ForEveryone />
      
      {/* Page 4: Sell here, there, and everywhere */}
      <SellEverywhere />
      
      {/* Page 5: Find your forever customers */}
      <FindCustomers />
      
      {/* Page 6: Grow around the world */}
      <GrowGlobally />
      
      {/* Page 7: Take care of business */}
      <ManageBusiness />
      
      {/* Page 8: There's no better place to build */}
      <PerformanceInnovation />
      
      {/* Page 9: Huntaze has your back */}
      <SupportFinancing />
      
      {/* Page 10: Start selling in no time */}
      <QuickStart />
    </>
  );
}
