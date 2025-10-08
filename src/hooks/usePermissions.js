import { useMemo } from 'react';

export const usePermissions = (userData) => {
  const access = useMemo(() => {
    if (!userData || !userData.access) return {};
    return userData.access;
  }, [userData]);

  const can = useMemo(() => {
    return (module, action = 'read') => {
      if (!access || !module) return false;
      
      const moduleAccess = access[module];
      if (!moduleAccess) return false;
      
      switch (action) {
        case 'read':
          return ['read', 'write', 'full'].includes(moduleAccess);
        case 'write':
          return ['write', 'full'].includes(moduleAccess);
        case 'delete':
          return moduleAccess === 'full';
        default:
          return false;
      }
    };
  }, [access]);

  return { access, can };
};