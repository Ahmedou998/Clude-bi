"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { Icon } from "./icons";
import { useToast } from "./providers";

type Point = { latitude: number; longitude: number; label?: string | null; updatedAt?: string | null };
type LocationData = { meeting: Point | null; live: Point | null };

function mapLink(point: Point) {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
}

export function BookingLocation({ bookingId, status, actor }: { bookingId: string; status: string; actor: "sender" | "traveler" }) {
  const toast = useToast();
  const [location, setLocation] = useState<LocationData>({ meeting: null, live: null });
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const active = ["ACCEPTED", "PAID", "HANDED_OVER"].includes(status);

  async function refreshLocation() {
    try {
      const result = await api<{ data: LocationData }>(`/api/bookings/${bookingId}/location`);
      setLocation(result.data);
    } catch { /* l'accès sera réessayé au prochain rafraîchissement */ }
  }

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    async function refresh() {
      try {
        const result = await api<{ data: LocationData }>(`/api/bookings/${bookingId}/location`);
        if (!disposed) setLocation(result.data);
      } catch { /* l'accès sera réessayé au prochain rafraîchissement */ }
    }
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15_000);
    return () => { disposed = true; window.clearTimeout(initial); window.clearInterval(timer); };
  }, [active, bookingId]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  function getCurrentPosition(onPosition: (position: GeolocationPosition) => void, onError: () => void = () => undefined) {
    if (!navigator.geolocation) {
      toast("La géolocalisation n'est pas disponible sur cet appareil.", "error");
      onError();
      return;
    }
    navigator.geolocation.getCurrentPosition(onPosition, (error) => { toast(error.message, "error"); onError(); }, { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 });
  }

  function shareMeetingPoint() {
    setLoading(true);
    getCurrentPosition(async ({ coords }) => {
      try {
        await api(`/api/bookings/${bookingId}/location`, { body: { kind: "meeting", latitude: coords.latitude, longitude: coords.longitude, label: label.trim() || undefined } });
        await refreshLocation();
        toast("Point de rendez-vous partagé avec l'autre participant.", "ok");
      } catch (error) { toast((error as Error).message, "error"); }
      setLoading(false);
    }, () => setLoading(false));
  }

  function startLiveSharing() {
    if (!navigator.geolocation) {
      toast("La géolocalisation n'est pas disponible sur cet appareil.", "error");
      return;
    }
    setSharing(true);
    lastSentAt.current = 0;
    watchId.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (Date.now() - lastSentAt.current < 15_000) return;
      lastSentAt.current = Date.now();
      try {
        await api(`/api/bookings/${bookingId}/location`, { body: { kind: "live", latitude: coords.latitude, longitude: coords.longitude } });
        await refreshLocation();
      } catch (error) {
        stopLiveSharing();
        toast((error as Error).message, "error");
      }
    }, (error) => {
      stopLiveSharing();
      toast(error.message, "error");
    }, { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 });
  }

  function stopLiveSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
    void api(`/api/bookings/${bookingId}/location`, { method: "DELETE" }).then(refreshLocation).catch(() => undefined);
  }

  if (!active) return null;

  return (
    <section className="panel stack" aria-labelledby="location-title">
      <div className="spread">
        <h3 id="location-title" style={{ fontSize: 20 }}>Localisation de la remise</h3>
        <Icon name="pin" size={20} />
      </div>
      <p className="muted" style={{ fontSize: 14 }}>Les positions ne sont visibles qu&apos;entre les deux participants. Le partage GPS est volontaire et s&apos;arrête quand vous le désactivez.</p>

      <div className="location-block">
        <b>Point de rendez-vous</b>
        {location.meeting ? (
          <div className="row">
            <span>{location.meeting.label || "Point partagé"}</span>
            <a className="btn btn-ghost btn-sm" href={mapLink(location.meeting)} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" size={15} /> Itinéraire</a>
          </div>
        ) : <span className="muted" style={{ fontSize: 14 }}>Aucun point partagé.</span>}
        <div className="row location-entry">
          <input className="input" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} placeholder="Nom du lieu (facultatif)" aria-label="Nom du lieu de rendez-vous" />
          <button className="btn btn-ink btn-sm" disabled={loading} onClick={shareMeetingPoint}>{loading ? <span className="spinner" /> : <><Icon name="pin" size={15} /> Partager ma position</>}</button>
        </div>
      </div>

      {status === "HANDED_OVER" && (
        <div className="location-block">
          <b>Suivi du trajet</b>
          {location.live ? (
            <div className="row">
              <span className="muted" style={{ fontSize: 14 }}>Position reçue {location.live.updatedAt ? formatDate(location.live.updatedAt) : "à l'instant"}</span>
              <a className="btn btn-ghost btn-sm" href={mapLink(location.live)} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" size={15} /> Localiser</a>
            </div>
          ) : <span className="muted" style={{ fontSize: 14 }}>En attente du partage GPS du voyageur.</span>}
          {actor === "traveler" && <button className={`btn ${sharing ? "btn-danger" : "btn-gold"} btn-sm`} onClick={sharing ? stopLiveSharing : startLiveSharing}>
            <Icon name={sharing ? "x" : "pin"} size={15} /> {sharing ? "Arrêter le partage GPS" : "Activer mon suivi GPS"}
          </button>}
          <small className="muted">Mise à jour environ toutes les 15 secondes; une position de plus de 2 minutes n&apos;est plus partagée. Gardez cette page ouverte.</small>
        </div>
      )}
    </section>
  );
}