import { clearLockout } from '@/lib/lockout';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Everything that belongs to a single run of the game. Player identity (name, age,
// level) and device info are not part of it and are left untouched.
export function resetRunStorage(storage: StorageLike, startedAt: Date): void {
	storage.removeItem('endTime');
	storage.removeItem('currentRoom');
	storage.setItem('startTime', startedAt.toISOString());
	storage.setItem('hintsRemaining', '3');
	storage.setItem('hintsUsed', '0');
	storage.setItem('score', '0');
	storage.setItem('combo', '0');
	storage.setItem('bestCombo', '0');
	clearLockout(storage);
}
