"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Label from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type Status = "draft" | "scheduled" | "published";

type PlatformKey = "onlyfans" | "reddit" | "instagram";

const PLATFORMS: PlatformKey[] = ["onlyfans", "reddit", "instagram"];

export default function PlannerPage() {
  const [status, setStatus] = useState<Status>("draft");
  const [platforms, setPlatforms] = useState<PlatformKey[]>(["onlyfans", "instagram"]);
  const [message, setMessage] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("21:00");
  const [price, setPrice] = useState<string>("");
  const [cta, setCta] = useState<string>('DM me "VIP" to unlock tonight’s drop');
  const [utmMedium, setUtmMedium] = useState<string>("story");
  const [utmCampaign, setUtmCampaign] = useState<string>("sm_weekly_drop");
  const [ideas, setIdeas] = useState<string>(
`BTS clip d'aujourd'hui
Sondage : "Quel look pour ce soir ?"
Sticker compte à rebours pour le live VIP`
  );

  const utmPreview = useMemo(() => {
    try {
      const url = new URL("https://huntaze.link/to/onlyfans");
      url.searchParams.set("utm_source", "instagram");
      url.searchParams.set("utm_medium", utmMedium);
      url.searchParams.set("utm_campaign", utmCampaign);
      return url.toString();
    } catch {
      return "URL invalide";
    }
  }, [utmMedium, utmCampaign]);

  const togglePlatform = (key: PlatformKey) => {
    setPlatforms((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media — Planner"
        description="Plan your posts, prepare stories, and generate UTM links."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">Compact</Button>
            <Button variant="outline">Discard</Button>
            <Button>Schedule post</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Compose & schedule</CardTitle>
            <CardDescription>Write your teaser, choose the time and the platforms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Teaser ou story copy"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="ex. 25"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plateformes</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => {
                  const active = platforms.includes(platform);
                  const label = platform[0].toUpperCase() + platform.slice(1);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={
                        "rounded-md border px-3 py-1.5 text-sm transition " +
                        (active
                          ? "bg-brand/10 text-brand ring-1 ring-brand/20"
                          : "hover:bg-muted")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Statut:</span>
              <div className="flex items-center gap-2">
                {(
                  [
                    { value: "draft", badge: <Badge>Draft</Badge> },
                    { value: "scheduled", badge: <Badge variant="info">Scheduled</Badge> },
                    { value: "published", badge: <Badge variant="success">Published</Badge> }
                  ] as const
                ).map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="planner-status"
                      className="h-4 w-4 text-brand border-input"
                      checked={status === item.value}
                      onChange={() => setStatus(item.value)}
                    />
                    {item.badge}
                  </label>
                ))}
              </div>
            </div>
            <Button>Enregistrer</Button>
          </CardFooter>
        </Card>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant de planification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 p-3 text-sm">
                <div className="font-medium">Planification intelligente bientôt disponible.</div>
                <div className="text-amber-700 dark:text-amber-300">
                  Programmez vos posts et revenez plus tard pour les recommandations d’horaires optimaux.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary">Construire un lien UTM</Button>
              <Button variant="secondary">Prepare smart replies</Button>
              <Button variant="secondary">Tag VIPs</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Story & short‑form ideas</CardTitle>
          <CardDescription>Keep your prompts here — reuse them later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={ideas} onChange={(event) => setIdeas(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CTA & UTM combo</CardTitle>
          <CardDescription>Preview the tracked URL for your stories/bios/posts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cta">Caption CTA</Label>
              <Textarea id="cta" value={cta} onChange={(event) => setCta(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utm-medium">UTM Medium</Label>
              <select
                id="utm-medium"
                value={utmMedium}
                onChange={(event) => setUtmMedium(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {(["story", "bio", "post", "reel"] as const).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="space-y-1.5 mt-3">
                <Label htmlFor="utm-campaign">UTM Campaign</Label>
                <Input
                  id="utm-campaign"
                  value={utmCampaign}
                  onChange={(event) => setUtmCampaign(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm overflow-x-auto">{utmPreview}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button>Generate tracked link</Button>
            <span className="text-sm text-muted-foreground">The link is auto‑generated in the preview.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
