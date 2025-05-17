import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { userRole } from 'generated/prisma';
import { ROLES_KEY } from 'src/decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<userRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const user = context.switchToHttp().getRequest().user;
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    if (!hasRequiredRole) {
      throw new ForbiddenException('Bạn không đủ quyền hạn');
    }

    return hasRequiredRole;
  }
}
