import { CITY_SUGGESTIONS } from "@/lib/catalog";

export function CityList() {
  return <datalist id="cities">{CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>;
}
