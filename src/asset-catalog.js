export const ASSET_CATALOG = {
  actor_neutral: { kind: 'actor', label: '중립 배우', url: '/assets/models/actor-neutral.glb', scale: 1 },
  sedan_blockout: { kind: 'prop', label: '세단 블록아웃', url: '/assets/models/sedan-blockout.glb', scale: 1 },
  warehouse_blockout: { kind: 'environment', label: '창고 블록아웃', url: '/assets/models/warehouse-blockout.glb', scale: 1 },
};

export function resolveAsset(assetId) { return ASSET_CATALOG[assetId] || null; }
