"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type LinkItem = {
  id: string;
  name: string;
  slug?: string;
  destination: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  createdAt: string;
};

export default function FunnelsPage() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [name, setName] = useState("instagram_bio");
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("https://onlyfans.com/");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("bio");
  const [campaign, setCampaign] = useState("sm_weekly_drop");
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    try {
      const url = new URL(destination);
      url.searchParams.set("utm_source", source);
      url.searchParams.set("utm_medium", medium);
      url.searchParams.set("utm_campaign", campaign);
      return url.toString();
    } catch {
      return "Invalid URL";
    }
  }, [destination, source, medium, campaign]);

  function saveLink() {
    try {
      if (!destination) throw new Error("Destination required");
      const id = Math.random().toString(36).slice(2);
      const createdAt = new Date().toISOString();
      const item: LinkItem = {
        id,
        name,
        slug: slug || undefined,
        destination,
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        createdAt,
      };
      setItems((prev) => [item, ...prev]);
      setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save link"
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Links"
        description="Create UTM links and save them for reuse."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">Compact</Button>
            <Button onClick={saveLink}>Save link</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Builder</CardTitle>
            <CardDescription>Fill in the fields. The preview updates automatically.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="ex: of-bio" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="https://…" />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>UTM source</Label>
                <Input value={source} onChange={(event) => setSource(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>UTM medium</Label>
                <Input value={medium} onChange={(event) => setMedium(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>UTM campaign</Label>
                <Input value={campaign} onChange={(event) => setCampaign(event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Preview (destination)</Label>
              <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm overflow-x-auto">{preview}</div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center gap-2">
            <Button onClick={saveLink}>Save link</Button>
            <Button variant="outline">Refresh</Button>
            <span className="text-sm text-muted-foreground">Links are stored locally for the demo.</span>
          </CardFooter>
        </Card>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Docs</CardTitle>
              <CardDescription>API endpoints (to wire)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>• <code>GET /api/tracking-links</code> — list links.</div>
              <div>• <code>POST /api/tracking-links</code> — create (Prisma + unique slug).</div>
              <div>• Configure <code>NEXT_PUBLIC_APP_URL</code> for your redirect domain.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">Links stored: <strong>{items.length}</strong></div>
              {error ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-2 text-sm text-rose-700 dark:text-rose-300">
                  Error: {error}
                </div>
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-2 text-sm text-emerald-700 dark:text-emerald-300">
                  OK
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
          <CardHeader className="flex flex-col gap-1">
          <CardTitle>Saved links</CardTitle>
          <CardDescription>They will appear here after \"Save link\".</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No links yet. Use the builder above to create one.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((link) => (
                <div key={link.id} className="rounded-md border border-border p-3 bg-card card-shadow">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{link.name}</div>
                    <Badge variant="outline">
                      {link.utm_source} → {link.utm_medium}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground break-all">{link.destination}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    campaign: <span className="font-mono">{link.utm_campaign}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
