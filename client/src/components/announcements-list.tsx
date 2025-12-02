import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQueryFn } from "@/lib/queryClient";
import type { Announcement } from "@shared/schema";

export default function AnnouncementsList() {
  const { data, isLoading } = useQuery<Announcement[] | null>({
    queryKey: ["/api/announcements"],
    // reuse default fetch logic from queryClient (but here show explicit fn to avoid 401 behavior differences)
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading || !data) return null;

  const active = data.filter((a) => a.isActive);
  if (!active.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annonces</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {active.map((ann) => (
            <li key={ann.id} className="border p-3 rounded-md bg-muted/50">
              <div className="font-medium">{ann.title}</div>
              <div className="text-sm text-muted-foreground">{ann.body}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
