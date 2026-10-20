export const GROUND = 242
export const PLAYER_X = 90
export const PLAYER_WIDTH = 28
export const PLAYER_HEIGHT = 51
export const GRAVITY = 1400
export const JUMP_SPEED = -540
export interface Obstacle { x: number; width: number; hit: boolean; passed: boolean }
export function collides(playerY: number, obstacle: Obstacle): boolean {
  return obstacle.x < PLAYER_X + PLAYER_WIDTH - 4 && obstacle.x + obstacle.width > PLAYER_X + 4 && playerY + PLAYER_HEIGHT > GROUND - 8
}
export function tickJump(y: number, velocity: number, delta: number) {
  const nextVelocity = velocity + GRAVITY * delta
  const nextY = y + nextVelocity * delta
  return nextY >= GROUND - PLAYER_HEIGHT ? { y: GROUND - PLAYER_HEIGHT, velocity: 0 } : { y: nextY, velocity: nextVelocity }
}
