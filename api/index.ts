import { app, initApp } from '../backend/src/app';

export default async function handler(req: any, res: any) {
  await initApp();
  return app(req, res);
}
