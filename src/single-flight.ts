/** Reject concurrent submissions while one operation is being prepared or sent. */
export function singleFlight<TArgs extends unknown[], TResult>(operation: (...args: TArgs) => Promise<TResult>) {
 let running = false;
 return async (...args: TArgs): Promise<TResult> => {
  if (running) throw new Error('Já existe uma operação em curso.');
  running = true;
  try { return await operation(...args); } finally { running = false; }
 };
}
