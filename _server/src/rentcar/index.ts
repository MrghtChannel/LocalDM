import * as rpc from 'rage-rpc';
import { eq, gte, sql } from 'drizzle-orm';
import { $db } from '@/db';
import { charactersTable } from '@/db/schema';

type Vec3Tuple = [number, number, number];

interface RentSite {
    id: string;
    col: { x: number; y: number; r: number };
    ped?: { pos: Vec3Tuple; heading: number; model?: string; label?: string };
    vehicle: { coords: Vec3Tuple; heading: number };
    clientPed?: boolean;
}

interface Spawn {
    coords: Vector3;
    heading: number;
}

interface RentCar {
    id: number;
    name: string;
    spawnCar: string;
    price: number;
}

declare global {
    // eslint-disable-next-line no-var
    var FACTIONLESS_RENT_SPAWN: { x: number; y: number; z: number; h?: number } | undefined;
    // eslint-disable-next-line no-var
    var FACTIONLESS_HUB_SPAWN: { x: number; y: number; z: number; h?: number } | undefined;
    // eslint-disable-next-line no-var
    var FACTIONLESS_RENT_VEHICLE_SPAWN: { x: number; y: number; z: number; h?: number } | undefined;
    // eslint-disable-next-line no-var
    var DB: { query: (sql: string, params: unknown[], cb: (err: unknown) => void) => void };
    // eslint-disable-next-line no-var
    var color: Record<number, number[]> | undefined;
    // eslint-disable-next-line no-var
    var formatnum1: (n: number | string) => string;
    // eslint-disable-next-line no-var
    var deleteVeh: (veh: unknown) => void;
    // eslint-disable-next-line no-var
    var flowVehiclePlate: () => string;
    // eslint-disable-next-line no-var
    var tryCompleteNewbieQuest: ((player: PlayerMp, key: string) => void) | undefined;
    // eslint-disable-next-line no-var
    var isNotify: (player: PlayerMp, type: number, pos: string, text: string, time: number) => void;

    interface PlayerMp {
        money: number | string;
        static: number | string;
        carActive?: VehicleMp;
        spawnCar?: number;
        setVariable(keyOrValues: string | Record<string, unknown>, value?: unknown): void;
    }
}

const RENT_SPAWN_SITES: RentSite[] = [
    {
        id: 'rent_frac_1',
        col: { x: -4.780910968780518, y: -1415.6131591796875, r: 2 },
        ped: { pos: [-4.780910968780518, -1415.6131591796875, 29.29814338684082], heading: -14.936514854431152 },
        vehicle: { coords: [162.6346893310547, -1737.1805419921875, 29.296659469604492], heading: 143.68858337402344 }
    },
    {
        id: 'rent_frac_2',
        col: { x: 159.190185546875, y: -1726.7152099609375, r: 2 },
        ped: { pos: [159.190185546875, -1726.7152099609375, 29.29168701171875], heading: -101.74408721923828 },
        vehicle: { coords: [-8.27456283569336, -1393.0020751953125, 29.325071334838867], heading: -0.49740394949913025 }
    },
    {
        id: 'rent_frac_3',
        col: { x: 924.3528442382812, y: -1567.64501953125, r: 2 },
        ped: { pos: [924.3528442382812, -1567.64501953125, 30.814775466918945], heading: 83.72959899902344 },
        vehicle: { coords: [947.6864013671875, -1575.105712890625, 30.406959533691406], heading: -90.59761810302734 }
    },
    {
        id: 'rent_frac_4',
        col: { x: 846.9677124023438, y: -2332.51416015625, r: 2 },
        ped: { pos: [846.9677124023438, -2332.51416015625, 30.336109161376953], heading: 179.30479431152344 },
        vehicle: { coords: [882.578369140625, -2349.63818359375, 30.3311767578125], heading: 85.19712829589844 }
    },
    {
        id: 'rent_frac_5',
        col: { x: 1386.5477294921875, y: -2072.5537109375, r: 2 },
        ped: { pos: [1386.5477294921875, -2072.5537109375, 51.99674606323242], heading: 35.44103240966797 },
        vehicle: { coords: [1365.00537109375, -2027.314453125, 52.04342269897461], heading: 27.64814567565918 }
    },
    {
        id: 'rent_fib',
        col: { x: 423.1767272949219, y: -976.6810302734375, r: 2 },
        ped: { pos: [423.18, -976.68, 30.71], heading: -135 },
        vehicle: { coords: [399.7075500488281, -976.3340454101562, 28.864429473876953], heading: 178.8184356689453 }
    },
    {
        id: 'rent_ems',
        col: { x: 331.0845642089844, y: -1399.398193359375, r: 2 },
        vehicle: { coords: [315.5148620605469, -1371.0447998046875, 32.5093994140625], heading: 140.22457885742188 },
        clientPed: true
    },
    {
        id: 'rent_arena',
        col: { x: -250.7865, y: -2037.3282, r: 2 },
        ped: { pos: [-250.7865, -2037.3282, 29.946], heading: 228.7076, model: 's_m_y_valet_01', label: 'Аренда транспорта (E)' },
        vehicle: { coords: [-246.15, -2043.65, 29.946], heading: 228.7076 }
    },
    {
        id: 'rent_casino',
        col: { x: 886.9106, y: -0.4352, r: 2 },
        ped: { pos: [886.9106, -0.4352, 78.765], heading: 146.1388, model: 's_m_y_valet_01', label: 'Аренда транспорта (E)' },
        vehicle: { coords: [881.09, 3.46, 78.765], heading: 56.1388 }
    },
    {
        id: 'rent_port',
        col: { x: -419.6007, y: -2740.6179, r: 2 },
        ped: { pos: [-419.6007, -2740.6179, 6.0002], heading: 1.4844, model: 'a_m_m_prolhost_01', label: 'Аренда транспорта (E)' },
        vehicle: { coords: [-419.4, -2732.8, 6.0002], heading: 1.4844 }
    },
    {
        id: 'rent_construction',
        col: { x: 155.8669, y: -347.4565, r: 2 },
        ped: { pos: [155.8669, -347.4565, 44.1976], heading: 1.811, model: 'a_m_m_prolhost_01', label: 'Аренда транспорта (E)' },
        vehicle: { coords: [155.87, -339.64, 44.1976], heading: 1.811 }
    }
];

/** Радиус взаимодействия с NPC аренды на спавне новичков. */
const FACTIONLESS_HUB_RENT_RADIUS = 2.5;
/** Запас к радиусу при серверной проверке (клиент проверяет по своим координатам). */
const RENT_SERVER_DIST_MARGIN = 2.0;

const flRent = { x: -193.80992126464844, y: -804.4339599609375, z: 30.45510482788086, h: 18.35268211364746 };
const flHub = { x: -169.429931640625, y: -813.7645874023438, z: 31.305158615112305, h: 173.6284942626953 };

function dist2d(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(ax - bx, ay - by);
}

function isNearFactionlessRent(player: PlayerMp, maxDist: number): boolean {
    if (!flRent) return false;
    const p = player.position;
    return dist2d(p.x, p.y, flRent.x, flRent.y) <= maxDist;
}

function findRentSite(player: PlayerMp): RentSite | null {
    const p = player.position;
    let best: RentSite | null = null;
    let bestD = Infinity;
    for (const site of RENT_SPAWN_SITES) {
        const d = dist2d(p.x, p.y, site.col.x, site.col.y);
        if (d <= site.col.r + RENT_SERVER_DIST_MARGIN && d < bestD) {
            best = site;
            bestD = d;
        }
    }
    return best;
}

function getFactionlessVehicleSpawn(): Spawn | null {
    const v = flHub;
    if (!v) return null;
    return { coords: new mp.Vector3(v.x, v.y, v.z), heading: v.h != null ? Number(v.h) : 0 };
}

function spawnFromSite(site: RentSite): Spawn {
    const c = site.vehicle.coords;
    return { coords: new mp.Vector3(c[0], c[1], c[2]), heading: Number(site.vehicle.heading) || 0 };
}

const RENT_BIKE_MODELS = new Set(['ktm125']);
const RENT_HELI_MODELS = new Set(['seasparrow2']);

const RENT_SITE_FRACTION: Record<string, number> = {
    rent_frac_1: 1,
    rent_frac_2: 2,
    rent_frac_3: 3,
    rent_frac_4: 4,
    rent_frac_5: 5,
    rent_fib: 6
};

/** Вертолётные площадки фракций. */
const RENT_HELI_PADS: Record<number, { coords: Vec3Tuple; heading: number }> = {
    1: { coords: [195.10916137695312, -1717.4456787109375, 32.87907409667969], heading: -152.99810791015625 },
    2: { coords: [-27.69335174560547, -1404.211669921875, 34.58267593383789], heading: -84.3482894897461 },
    3: { coords: [277.1607971191406, -1911.7969970703125, 29.318302154541016], heading: 46.84783935546875 },
    4: { coords: [-334.8177185058594, -1544.5433349609375, 36.10999298095703], heading: -88.7071762084961 },
    5: { coords: [553.998046875, -1776.806884765625, 37.10675048828125], heading: -114.60282135009766 },
    6: { coords: [449.1666259765625, -981.3761596679688, 43.6916618347168], heading: 178.8184356689453 }
};

function getHeliSpawn(siteId: string | null, fallback: Spawn): Spawn {
    const frac = siteId ? RENT_SITE_FRACTION[siteId] : undefined;
    const pad = frac ? RENT_HELI_PADS[frac] : undefined;
    if (pad) {
        return { coords: new mp.Vector3(pad.coords[0], pad.coords[1], pad.coords[2]), heading: Number(pad.heading) || 0 };
    }
    const c = fallback.coords;
    return { coords: new mp.Vector3(c.x, c.y, c.z + 1.5), heading: fallback.heading };
}

const rentCars: RentCar[] = [
    { id: 1, name: 'Pariah', spawnCar: 'pariah', price: 500 },
    { id: 2, name: 'Raiden', spawnCar: 'raiden', price: 500 },
    { id: 3, name: 'XA-21', spawnCar: 'xa21', price: 1000 },
    { id: 4, name: 'T20', spawnCar: 't20', price: 1000 },
    { id: 5, name: 'Elegy2', spawnCar: 'elegy2', price: 2500 },
    { id: 6, name: 'Toros', spawnCar: 'toros', price: 2500 },
    { id: 7, name: 'Dominator3', spawnCar: 'dominator3', price: 5000 },
    { id: 8, name: 'Baller6', spawnCar: 'baller6', price: 1000 },
    { id: 9, name: 'XLS2', spawnCar: 'xls2', price: 2500 },
    { id: 10, name: 'FBI2', spawnCar: 'fbi2', price: 5000 },
    { id: 12, name: 'Avtr', spawnCar: 'avtr', price: 7500 },
    { id: 13, name: 'BMW E70', spawnCar: 'bmwe70', price: 6000 },
    { id: 14, name: 'Principe 125 2006', spawnCar: 'ktm125', price: 2500 },
    { id: 15, name: 'Sparrow', spawnCar: 'seasparrow2', price: 50000 }
];

const RENT_ALIASES: Record<string, string> = {
    xa21: 'XA-21',
    baller6: 'Baller6',
    xls2: 'XLS2',
    fbi: 'FBI2',
    elegy2: 'Elegy2',
    dominator3: 'Dominator3',
    toros: 'Toros',
    pariah: 'Pariah',
    raiden: 'Raiden',
    t20: 'T20',
    avtr: 'Avtr',
    bmwe70: 'BMW E70',
    ktm125: 'Principe 125 2006',
    seasparrow2: 'Sparrow',
    sparrow: 'Sparrow'
};

function resolveRentCar(vehmodel: unknown): RentCar | null {
    const raw = String(vehmodel ?? '').trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const canonical = RENT_ALIASES[lower] || raw;
    for (const car of rentCars) {
        if (car.name === canonical) return car;
        if (car.name.toLowerCase() === lower) return car;
        if (car.spawnCar.toLowerCase() === lower) return car;
    }
    return null;
}

function offsetSpawnPos(coords: Vector3, heading: number, metersBack: number): Vector3 {
    const hRad = (heading * Math.PI) / 180;
    return new mp.Vector3(
        coords.x - Math.sin(hRad) * metersBack,
        coords.y + Math.cos(hRad) * metersBack,
        coords.z + 0.05
    );
}

rpc.register('rent:legacy:car', (vehmodel: unknown, info: rpc.ProcedureListenerInfo): void => {
    const player = info.player as PlayerMp | undefined;
    if (!player) return;

    try {
        if (!mp.players.exists(player) || !player.getVariable('auth')) return;
        if (player.dimension !== 0) return;
        if (player.spawnCar && Date.now() - player.spawnCar < 3000) return;

        // Определяем точку аренды по позиции игрока
        const hubRent = isNearFactionlessRent(player, FACTIONLESS_HUB_RENT_RADIUS + RENT_SERVER_DIST_MARGIN);
        const site = hubRent ? null : findRentSite(player);
        if (!hubRent && !site) {
            global.isNotify(player, 2, 'top-mid', 'Подойдите к NPC аренды.', 3000);
            return;
        }
        const siteId = hubRent ? 'rent_factionless' : site!.id;

        const rentCar = resolveRentCar(vehmodel);
        if (!rentCar) {
            global.isNotify(player, 2, 'top-mid', 'Транспорт не найден.', 3000);
            return;
        }

        let spawn: Spawn | null = hubRent ? getFactionlessVehicleSpawn() : spawnFromSite(site!);
        if (!spawn) {
            global.isNotify(player, 2, 'top-mid', 'Аренда сейчас недоступна.', 3000);
            return;
        }

        const isBike = RENT_BIKE_MODELS.has(rentCar.spawnCar.toLowerCase());
        const isHeli = RENT_HELI_MODELS.has(rentCar.spawnCar.toLowerCase());

        if (isHeli) spawn = getHeliSpawn(siteId, spawn);

        const vehHeading = spawn.heading;
        let vehSpawnPos = spawn.coords;
        // Мото и вертолёт — без смещения назад, иначе застревают / падают
        if (!isHeli && !isBike && !hubRent) {
            vehSpawnPos = offsetSpawnPos(vehSpawnPos, vehHeading, 5);
        }

        const money = Number(player.money) || 0;
        if (money < rentCar.price) {
            global.isNotify(player, 2, 'top-mid', 'Недостаточно средств для аренды.', 3000);
            return;
        }

        const newMoney = money - rentCar.price;
        global.DB.query('UPDATE accounts SET money = ? WHERE static = ?', [newMoney, player.static], (err: unknown): void => {
            if (err) console.log(err);
        });
        player.call('updateMoney', [global.formatnum1(newMoney)]);
        player.money = newMoney;
        global.isNotify(player, 3, 'top-mid', `-${global.formatnum1(rentCar.price)}$`, 3000);

        global.deleteVeh(player.carActive);
        player.call('stopcrawling');

        const skipPlayerTeleport = isBike || isHeli;
        if (!skipPlayerTeleport) {
            try {
                player.position = vehSpawnPos;
                player.heading = vehHeading;
            } catch {
                // ignore
            }
        }

        const fracId = parseInt(String(player.getVariable('fraction')), 10) || 0;
        const colors = global.color;
        const colorveh = (colors && colors[fracId]) || (colors && colors[0]) || [111, 111];

        const car = mp.vehicles.new(mp.joaat(rentCar.spawnCar), vehSpawnPos, {
            numberPlate: global.flowVehiclePlate(),
            dimension: player.dimension,
            locked: false,
            engine: isHeli,
            alpha: 255,
            heading: vehHeading
        });

        if (car && mp.vehicles.exists(car)) {
            car.setColor(colorveh[0], 0);
            car.setVariable('owner', player.static);
            car.setVariable('rent', true);
            player.carActive = car;
        }

        // Клиент слушает это через mp.events.add, поэтому player.call, а не rpc
        try {
            player.call('rent:syncSpawn:c', [vehSpawnPos.x, vehSpawnPos.y, vehSpawnPos.z, vehHeading, skipPlayerTeleport ? 1 : 0]);
        } catch {
            // ignore
        }

        setTimeout((): void => {
            if (!mp.players.exists(player)) return;
            if (!car || !mp.vehicles.exists(car)) return;
            try {
                car.position = vehSpawnPos;
                car.rotation = new mp.Vector3(0, 0, vehHeading);
                if (!skipPlayerTeleport) {
                    player.position = vehSpawnPos;
                    player.heading = vehHeading;
                }
                player.putIntoVehicle(car, 0);
            } catch {
                // ignore
            }
        }, isHeli || isBike ? 250 : 450);

        player.spawnCar = Date.now();
        if (typeof global.tryCompleteNewbieQuest === 'function') {
            global.tryCompleteNewbieQuest(player, 'rent_car');
        }
    } catch (error) {
        console.log(error);
    }
});

rpc.register('rent:open', (info: rpc.ProcedureListenerInfo) => {
    const player = info.player as PlayerMp | undefined;
    if (!player?._id || !player?._characterId || player.dimension !== 0) return { error: 'Сначала выберите персонажа.' };
    const hub = isNearFactionlessRent(player, FACTIONLESS_HUB_RENT_RADIUS + RENT_SERVER_DIST_MARGIN);
    const site = hub ? null : findRentSite(player);
    if (!hub && !site) return { error: 'Подойдите к NPC аренды.' };
    return { data: { cars: rentCars.map(({ id, name, spawnCar, price }) => ({ id, name, model: spawnCar, price })), hub, siteId: hub ? 'rent_factionless' : site!.id } };
});

rpc.register('rent:car', async (vehmodel: unknown, info: rpc.ProcedureListenerInfo) => {
    const player = info.player as PlayerMp | undefined;
    if (!player?._id || !player?._characterId || player.dimension !== 0 || !mp.players.exists(player)) return { error: 'Сначала выберите персонажа.' };
    const hub = isNearFactionlessRent(player, FACTIONLESS_HUB_RENT_RADIUS + RENT_SERVER_DIST_MARGIN);
    const site = hub ? null : findRentSite(player);
    if (!hub && !site) return { error: 'Подойдите к NPC аренды.' };
    const rentCar = resolveRentCar(vehmodel);
    if (!rentCar) return { error: 'Транспорт не найден.' };
    let spawn: Spawn | null = hub ? getFactionlessVehicleSpawn() : spawnFromSite(site!);
    if (!spawn) return { error: 'Аренда сейчас недоступна.' };
    const model = rentCar.spawnCar.toLowerCase();
    const isBike = RENT_BIKE_MODELS.has(model);
    const isHeli = RENT_HELI_MODELS.has(model);
    if (isHeli) spawn = getHeliSpawn(hub ? 'rent_factionless' : site!.id, spawn);
    let position = spawn.coords;
    if (!isHeli && !isBike && !hub) position = offsetSpawnPos(position, spawn.heading, 5);
    const [updated] = await $db.update(charactersTable)
        .set({ money: sql`${charactersTable.money} - ${rentCar.price}` })
        .where(sql`${charactersTable.id} = ${player._characterId} AND ${charactersTable.playerId} = ${player._id} AND ${charactersTable.money} >= ${rentCar.price}`)
        .returning({ money: charactersTable.money });
    if (!updated) return { error: 'Недостаточно денег или персонаж не найден.' };
    try {
        const car = mp.vehicles.new(mp.joaat(model), position, {
            numberPlate: `R${player._characterId}${Math.floor(Math.random() * 1000)}`.slice(0, 8),
            dimension: player.dimension, locked: false, engine: isHeli, alpha: 255, heading: spawn.heading
        });
        car.setColor(111, 111);
        car.setVariable('owner', player._characterId);
        car.setVariable('rent', true);
        player.position = position;
        player.heading = spawn.heading;
        setTimeout(() => { if (mp.players.exists(player) && mp.vehicles.exists(car)) player.putIntoVehicle(car, 0); }, 450);
        player.call('rent:money', [updated.money]);
        if (typeof global.tryCompleteNewbieQuest === 'function') global.tryCompleteNewbieQuest(player, 'rent_car');
        return { success: true };
    } catch (error) {
        await $db.update(charactersTable).set({ money: sql`${charactersTable.money} + ${rentCar.price}` }).where(eq(charactersTable.id, player._characterId));
        console.error('[rentcar] vehicle spawn failed', error);
        return { error: 'Не удалось создать транспорт.' };
    }
});

/** Подписи над NPC аренды. */
const RENT_NPC_LABEL_LIFT = 1.15;

function rentInteractionLabel(label?: string): string {
    const text = String(label || 'Аренда транспорта').trim();
    return /\(E\)$/i.test(text) ? text : `${text} (E)`;
}

function createRentNpc(model: string, pos: Vec3Tuple, heading: number, label?: string): void {
    mp.peds.new(mp.joaat(model), new mp.Vector3(pos[0], pos[1], pos[2]), {
        dynamic: true,
        invincible: true,
        frozen: true,
        heading
    });
    mp.labels.new(rentInteractionLabel(label), new mp.Vector3(pos[0], pos[1], pos[2] + RENT_NPC_LABEL_LIFT), {
        font: 4,
        drawDistance: 12,
        color: [255, 255, 255, 255],
        los: false,
        dimension: 0
    });
}

RENT_SPAWN_SITES.forEach((site: RentSite): void => {
    if (!site.ped || site.clientPed) return;
    createRentNpc(site.ped.model || 'a_m_m_prolhost_01', site.ped.pos, site.ped.heading, site.ped.label);
});

// NPC на спавне новичков
if (flRent) {
    createRentNpc('a_m_m_prolhost_01', [flRent.x, flRent.y, flRent.z], flRent.h ?? 0);
}

export {};
