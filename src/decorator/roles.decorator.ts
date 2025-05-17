import { SetMetadata } from '@nestjs/common';
import { userRole } from 'generated/prisma';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: [userRole, ...userRole[]]) =>
  SetMetadata(ROLES_KEY, roles);
