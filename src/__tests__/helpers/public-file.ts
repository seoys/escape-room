import fs from 'node:fs';
import path from 'node:path';

export const publicFileExists = (publicPath: string): boolean =>
	fs.existsSync(path.join(process.cwd(), 'public', publicPath));
