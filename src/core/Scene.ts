export interface Scene {
  init(): void;
  update(deltaSeconds: number): void;
  destroy(): void;
}
