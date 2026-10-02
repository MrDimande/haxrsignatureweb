"use client";

import { useEffect, useState } from "react";
import { useAdminIdentity } from "@/components/admin/AdminIdentityProvider";

function getDaypart(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 19) return "Boa tarde";
  return "Boa noite";
}

function getMaputoHour(): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Maputo",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date()).find((part) => part.type === "hour")?.value;

  return Number(hour ?? "12");
}

export default function AdminGreeting() {
  const identity = useAdminIdentity();
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(getMaputoHour());
  }, []);

  const firstName = identity?.name.trim().split(/\s+/)[0];
  const greeting = firstName
    ? `${hour === null ? "Olá" : getDaypart(hour)}, ${firstName}`
    : "Operação HAXR";

  return (
    <div>
      <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
        Perspectiva operacional
      </span>
      <h2 className="font-serif text-2xl font-light text-white mt-1">{greeting}</h2>
      <p className="text-xs text-grey-medium mt-1 leading-relaxed">
        Eis o que está a acontecer na HAXR Signature hoje.
      </p>
    </div>
  );
}
