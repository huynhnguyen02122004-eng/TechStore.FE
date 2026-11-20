type ServiceMode = 'api' | 'demo';

const configuredMode = import.meta.env.VITE_SERVICE_MODE;

if (configuredMode && configuredMode !== 'api' && configuredMode !== 'demo') {
  throw new Error(`VITE_SERVICE_MODE không hợp lệ: ${configuredMode}.`);
}

const serviceMode: ServiceMode = configuredMode || 'api';

export function shouldUseDemoServices(token: string): boolean {
  return serviceMode === 'demo' || !token;
}
