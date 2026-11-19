/**
 * JARVIS AI CITY — ASHDOD 4D, world plan (style v5 "strategic industrial").
 * Units are metres. +x = east (inland), -x = west (Mediterranean), -z = north (port), +z = south.
 * Every main building has an id, footprint, floors, materials (via `kind`), LOD rule and interaction rules.
 */
export const COAST_X = -170;
export const ROAD_W = 9;
export const SIDEWALK = 3;
export const AVENUES = [-120, -60, 60, 120, 180, 240];          // north–south roads (x)
export const STREETS = [-180, -120, -60, 60, 120, 180, 240];    // west–east roads (z)
export const WORLD = { minX: COAST_X, maxX: 300, minZ: -235, maxZ: 290 };
export const RAIL_Z = -212;
export const FLOOR_H = 4.2;

export type Kind =
  | "tower" | "office" | "glass-office" | "lab" | "datacenter" | "security" | "factory" | "warehouse"
  | "residential" | "brick-residential" | "workshop";

export type RoomKind =
  | "lobby" | "reception" | "office" | "meeting" | "server" | "lounge" | "kitchen" | "lab" | "robotics" | "ai-core"
  | "control" | "owner" | "archive" | "observation" | "assembly" | "storage" | "machines" | "security-ops";

export interface RoomSpec { id: string; name: string; kind: RoomKind; x: number; z: number; w: number; d: number }
export interface FloorSpec { name: string; rooms: RoomSpec[] }
export interface BuildingSpec {
  id: string; name: string; kind: Kind; district: DistrictId;
  x: number; z: number; w: number; d: number; floors: number;
  folders?: string[];           // library agent districts whose agents work here
  interior?: FloorSpec[];       // main functional buildings are enterable
  rot?: number;
}

export type DistrictId =
  | "command" | "software" | "ai" | "industrial" | "research" | "security" | "business" | "logistics"
  | "datacenter" | "residential" | "port" | "marina" | "parks";

export const DISTRICTS: Record<DistrictId, { name: string; color: string }> = {
  command: { name: "Центральный командный район", color: "#38bdf8" },
  software: { name: "Район программной разработки", color: "#60a5fa" },
  ai: { name: "Район ИИ и аналитики", color: "#a78bfa" },
  industrial: { name: "Промышленный район", color: "#f59e0b" },
  research: { name: "Исследовательский комплекс", color: "#22d3ee" },
  security: { name: "Район безопасности и тестирования", color: "#f43f5e" },
  business: { name: "Бизнес-центр", color: "#fbbf24" },
  logistics: { name: "Логистический район", color: "#fb923c" },
  datacenter: { name: "Дата-центр", color: "#818cf8" },
  residential: { name: "Жилые кварталы", color: "#e5e7eb" },
  port: { name: "Порт Ашдода", color: "#fcd34d" },
  marina: { name: "Марина и набережная", color: "#7dd3fc" },
  parks: { name: "Парки и общественные пространства", color: "#4ade80" },
};

/* ---------- interior templates ---------- */
const R = (id: string, name: string, kind: RoomKind, x: number, z: number, w: number, d: number): RoomSpec => ({ id, name, kind, x, z, w, d });

/** Standard agent office floor (w × d footprint, local coords centred on the building). */
function officeFloor(w: number, d: number, n: number, label = "Офис"): FloorSpec {
  const hw = w / 2, hd = d / 2;
  return {
    name: `${label} ${n}`,
    rooms: [
      R(`f${n}-open`, "Открытый офис агентов", "office", -hw + 1, -hd + 1, w * 0.62 - 1, d - 2),
      R(`f${n}-meet`, "Переговорная", "meeting", -hw + w * 0.62 + 0.5, -hd + 1, w * 0.38 - 1.5, d * 0.45 - 1),
      R(`f${n}-lounge`, n % 2 ? "Комната отдыха и кухня" : "Серверная", n % 2 ? "lounge" : "server",
        -hw + w * 0.62 + 0.5, -hd + d * 0.45 + 0.5, w * 0.38 - 1.5, d * 0.55 - 1.5),
    ],
  };
}
const lobbyFloor = (w: number, d: number, name = "Вестибюль"): FloorSpec => ({
  name,
  rooms: [R("lobby", "Главный вестибюль", "lobby", -w / 2 + 1, -d / 2 + 1, w * 0.6 - 1, d - 2),
          R("reception", "Приёмная", "reception", -w / 2 + w * 0.6 + 0.5, -d / 2 + 1, w * 0.4 - 1.5, d * 0.5 - 1),
          R("kitchen", "Кухня и кафе", "kitchen", -w / 2 + w * 0.6 + 0.5, 0.5, w * 0.4 - 1.5, d * 0.5 - 1.5)],
});

/* ---------- main functional buildings ---------- */
export const TOWER: BuildingSpec = {
  id: "jarvis-tower", name: "Башня JARVIS", kind: "tower", district: "command", x: 0, z: 0, w: 30, d: 30, floors: 8,
  folders: ["00-jarvis"],
  interior: [
    { name: "Вестибюль", rooms: [R("t-lobby", "Главный вестибюль", "lobby", -14, -14, 17, 28), R("t-recep", "Приёмная", "reception", 4, -14, 10, 13), R("t-sec", "Центр безопасности", "security-ops", 4, 0, 10, 14)] },
    { name: "Командный центр", rooms: [R("t-cmd", "Командный центр", "control", -14, -14, 28, 16), R("t-ops", "Операционный зал", "office", -14, 3, 28, 11)] },
    { name: "Мониторинг агентов", rooms: [R("t-mon", "Центр мониторинга агентов", "control", -14, -14, 18, 28), R("t-meet", "Переговорная", "meeting", 5, -14, 9, 13), R("t-meet2", "Переговорная 2", "meeting", 5, 0, 9, 14)] },
    { name: "Проекты", rooms: [R("t-proj", "Зал управления проектами", "office", -14, -14, 28, 17), R("t-analytics", "Зал аналитики", "control", -14, 4, 28, 10)] },
    { name: "Серверы и архив", rooms: [R("t-srv", "Серверные помещения", "server", -14, -14, 16, 28), R("t-arch", "Архив результатов", "archive", 3, -14, 11, 28)] },
    { name: "Кабинет владельца", rooms: [R("t-owner", "Личный кабинет владельца", "owner", -14, -14, 28, 28)] },
    { name: "Смотровая площадка", rooms: [R("t-obs", "Панорамная смотровая площадка", "observation", -14, -14, 28, 28)] },
  ],
};

export const BUILDINGS: BuildingSpec[] = [
  TOWER,
  { id: "dev-core", name: "Центр разработки", kind: "office", district: "software", x: 90, z: -18, w: 40, d: 24, floors: 5, folders: ["01-core-development"],
    interior: [lobbyFloor(40, 24), officeFloor(40, 24, 1), officeFloor(40, 24, 2), officeFloor(40, 24, 3), officeFloor(40, 24, 4)] },
  { id: "dev-lang", name: "Корпус языков и фреймворков", kind: "glass-office", district: "software", x: 90, z: 26, w: 40, d: 26, floors: 6, folders: ["02-language-specialists"],
    interior: [lobbyFloor(40, 26), officeFloor(40, 26, 1), officeFloor(40, 26, 2), officeFloor(40, 26, 3), officeFloor(40, 26, 4), officeFloor(40, 26, 5)] },
  { id: "ai-hub", name: "Центр ИИ и аналитики", kind: "glass-office", district: "ai", x: 0, z: -92, w: 44, d: 30, floors: 5, folders: ["05-data-ai"],
    interior: [lobbyFloor(44, 30), { name: "Машинное обучение", rooms: [R("ai-ml", "Комната машинного обучения", "lab", -21, -14, 26, 28), R("ai-srv", "Серверная GPU", "server", 6, -14, 15, 28)] },
               officeFloor(44, 30, 2, "Аналитика"), officeFloor(44, 30, 3, "Аналитика"), { name: "Визуализация", rooms: [R("ai-vis", "Зал визуализации", "control", -21, -14, 42, 28)] }] },
  { id: "research", name: "Исследовательский комплекс", kind: "lab", district: "research", x: -90, z: 0, w: 42, d: 42, floors: 3, folders: ["10-research-analysis"],
    interior: [
      { name: "Лаборатории", rooms: [R("r-bio", "Комната экспериментов", "lab", -22, -22, 20, 20), R("r-core", "ИИ-ядро", "ai-core", -2, -22, 24, 20), R("r-robot", "Лаборатория робототехники", "robotics", -22, 0, 22, 21), R("r-lobby", "Вестибюль", "lobby", 2, 0, 20, 21)] },
      { name: "Анализ данных", rooms: [R("r-data", "Центр анализа данных", "office", -22, -22, 26, 44), R("r-srv", "Серверная", "server", 6, -22, 16, 20), R("r-meet", "Переговорная исследователей", "meeting", 6, 0, 16, 21)] },
      { name: "Моделирование", rooms: [R("r-sim", "Центр моделирования", "control", -22, -22, 44, 22), R("r-ml", "Лаборатория ИИ", "lab", -22, 2, 44, 20)] },
    ] },
  { id: "security", name: "Центр безопасности и тестирования", kind: "security", district: "security", x: 0, z: 92, w: 44, d: 30, floors: 4, folders: ["04-quality-security"],
    interior: [lobbyFloor(44, 30, "Контрольный пункт"), { name: "Операции безопасности", rooms: [R("s-ops", "Центр безопасности", "security-ops", -21, -14, 26, 28), R("s-srv", "Изолированная серверная", "server", 6, -14, 15, 28)] },
               officeFloor(44, 30, 2, "Тестирование"), officeFloor(44, 30, 3, "Ревью кода")] },
  { id: "business", name: "Бизнес-центр", kind: "glass-office", district: "business", x: 90, z: 92, w: 40, d: 30, floors: 7, folders: ["08-business-product"],
    interior: [lobbyFloor(40, 30), officeFloor(40, 30, 1, "Продукт"), officeFloor(40, 30, 2, "Маркетинг"), officeFloor(40, 30, 3, "Продажи"),
               { name: "Совет директоров", rooms: [R("b-board", "Большая переговорная", "meeting", -19, -14, 24, 28), R("b-lounge", "Лаунж", "lounge", 6, -14, 13, 28)] }] },
  { id: "datacenter", name: "Дата-центр", kind: "datacenter", district: "datacenter", x: 90, z: -92, w: 44, d: 30, floors: 3, folders: ["03-infrastructure"],
    interior: [{ name: "Машинный зал", rooms: [R("d-hall", "Серверный зал", "server", -21, -14, 30, 28), R("d-noc", "Операторская (NOC)", "control", 10, -14, 11, 28)] },
               officeFloor(44, 30, 1, "Инфраструктура"), { name: "Энергетика", rooms: [R("d-power", "Генераторы и щиты", "machines", -21, -14, 42, 28)] }] },
  { id: "logistics", name: "Логистический центр", kind: "warehouse", district: "logistics", x: -90, z: -92, w: 42, d: 32, floors: 2, folders: ["09-meta-orchestration"],
    interior: [{ name: "Склад", rooms: [R("l-store", "Складские помещения", "storage", -22, -15, 30, 30), R("l-dock", "Погрузочная зона", "storage", 9, -15, 13, 30)] },
               { name: "Диспетчерская", rooms: [R("l-disp", "Диспетчерская", "office", -22, -15, 28, 30), R("l-ctrl", "Контрольный пункт", "control", 7, -15, 15, 30)] }] },
  { id: "factory", name: "Сборочный завод", kind: "factory", district: "industrial", x: 150, z: -150, w: 42, d: 34, floors: 3, folders: ["06-developer-experience"],
    interior: [{ name: "Склад и насосная", rooms: [R("fa-store", "Склад комплектующих", "storage", -23, -16, 30, 32), R("fa-pump", "Генераторы и насосы", "machines", 8, -16, 15, 32)] },
               { name: "Сборочный цех", rooms: [R("fa-line", "Конвейер сборки", "assembly", -23, -16, 46, 32)] },
               { name: "Операторская", rooms: [R("fa-ops", "Операторская", "control", -23, -16, 26, 32), R("fa-eng", "Инженерный отдел", "office", 4, -16, 19, 32)] }] },
  { id: "factory-2", name: "Завод спецотраслей", kind: "factory", district: "industrial", x: 210, z: -150, w: 42, d: 34, floors: 3, folders: ["07-specialized-domains"],
    interior: [{ name: "Сборочный цех", rooms: [R("fb-line", "Конвейер", "assembly", -21, -16, 42, 32)] },
               { name: "Склад", rooms: [R("fb-store", "Склад", "storage", -21, -16, 42, 32)] },
               { name: "Операторская", rooms: [R("fb-ops", "Операторская", "control", -21, -16, 42, 32)] }] },
];

/* ---------- decorative buildings (procedural, not enterable as agent workplaces) ---------- */
export function cells() {
  const xs = [COAST_X + 14, ...AVENUES, WORLD.maxX];
  const zs = [WORLD.minZ + 26, ...STREETS, WORLD.maxZ];
  const out: { x0: number; x1: number; z0: number; z1: number; cx: number; cz: number; i: number; j: number }[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + (i ? ROAD_W / 2 + SIDEWALK : 0), x1 = xs[i + 1] - ROAD_W / 2 - SIDEWALK;
      const z0 = zs[j] + (j ? ROAD_W / 2 + SIDEWALK : 0), z1 = zs[j + 1] - ROAD_W / 2 - SIDEWALK;
      if (x1 - x0 > 10 && z1 - z0 > 10) out.push({ x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, i, j });
    }
  return out;
}

/** What occupies each grid cell (by centre). Unlisted cells inland become residential. */
export function cellUse(cx: number, cz: number): DistrictId | "main" | "plaza" | "coast" {
  if (cx > -60 && cx < 60 && cz > -60 && cz < 60) return "plaza";
  if (BUILDINGS.some((b) => Math.abs(b.x - cx) < 30 && Math.abs(b.z - cz) < 30)) return "main";
  if (cx < -120 && cz < -60) return "port";
  if (cx < -120 && cz > 60 && cz < 240) return "marina";
  if (cx < -120) return "coast";
  if (cz < -180) return "industrial";
  if (cz < -120 && cx > -60) return "industrial";
  if (cz < -60 && cx < -60) return "logistics";
  if ((cx > -120 && cx < -60 && cz > 60 && cz < 120) || (cx > -60 && cx < 60 && cz > 180 && cz < 240)) return "parks";
  if (cx > -120 && cx < -60 && cz > -60 && cz < 60) return "research";
  return "residential";
}
