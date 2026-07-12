"use client";

import IPhone17Frame from "@/components/ui/IPhone17Frame";
import DeviceLaptopFrame from "@/components/ui/DeviceLaptopFrame";
import DeviceTabletFrame from "@/components/ui/DeviceTabletFrame";
import LivePhoneScreen from "@/components/ui/LivePhoneScreen";
import { invitationShowcase } from "@/lib/site-config";

function LaptopDashboardMock() {
  return (
    <div className="h-full w-full p-4 md:p-5 grid grid-cols-3 gap-3">
      <div className="col-span-2 space-y-3">
        <div className="h-8 w-40 rounded bg-brand-gold/25" />
        <div className="grid grid-cols-3 gap-2">
          {["Confirmados", "Pendentes", "Total"].map((label) => (
            <div
              key={label}
              className="rounded border border-white/10 bg-white/5 p-2.5"
            >
              <p className="font-sans text-[8px] uppercase tracking-wider text-white/45 mb-1">
                {label}
              </p>
              <p className="font-serif text-lg text-brand-gold-light">128</p>
            </div>
          ))}
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-3 space-y-2">
          {[72, 58, 45, 38].map((w) => (
            <div
              key={w}
              className="h-2 rounded-full bg-brand-gold/20"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded border border-brand-gold/30 bg-brand-gold/10 p-3">
          <p className="font-sans text-[8px] uppercase text-brand-gold mb-1">
            RSVP
          </p>
          <p className="font-sans text-xs text-white/80">84% confirmados</p>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-3 h-24" />
        <div className="rounded border border-white/10 bg-white/5 p-3 h-16" />
      </div>
    </div>
  );
}

function TabletFindSeatMock() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#12100e] to-[#080706]">
      <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-brand-gold mb-3">
        Find Your Seat
      </p>
      <p className="font-serif text-xl text-white mb-4">Mesa 12 · Lugar 4</p>
      <div className="w-full max-w-[180px] h-20 border border-brand-gold/30 rounded grid grid-cols-4 gap-1 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm ${i === 3 ? "bg-brand-gold/50" : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="font-sans text-[10px] text-white/55 mt-4">
        Localize o seu lugar pelo nome
      </p>
    </div>
  );
}

export default function HomeDeviceCluster() {
  const phoneProject = invitationShowcase[0];

  return (
    <div className="relative w-full min-h-[340px] md:min-h-[420px] lg:min-h-[460px]">
      <div className="relative z-10 w-full max-w-[640px] mx-auto lg:mx-0 lg:ml-auto">
        <DeviceLaptopFrame>
          <LaptopDashboardMock />
        </DeviceLaptopFrame>
      </div>

      <div className="absolute left-0 md:left-4 bottom-4 md:bottom-8 z-20 hidden sm:block">
        <DeviceTabletFrame>
          <TabletFindSeatMock />
        </DeviceTabletFrame>
      </div>

      <div className="absolute right-0 md:right-4 bottom-0 z-30 w-[min(100%,200px)] md:w-[220px]">
        <IPhone17Frame showLabel={false} variant="compact" className="scale-[0.92] md:scale-100 origin-bottom-right">
          <LivePhoneScreen project={phoneProject} />
        </IPhone17Frame>
      </div>

      <div
        className="absolute inset-0 -z-0 rounded-full blur-[100px] bg-brand-gold/10 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
