import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginRequest, RegisterRequest, LoginResponse } from '@qinkang/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' },
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email ?? undefined,
        role: user.role,
        subRole: (user.subRole as any) ?? undefined,
        farmId: user.farmId ?? undefined,
        avatar: user.avatar ?? undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async register(dto: RegisterRequest): Promise<LoginResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new UnauthorizedException('该手机号已注册');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        phone: dto.phone,
        password: hashedPassword,
        role: (dto.role ?? 'farmer') as any,
        subRole: dto.subRole ?? null,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' },
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role,
        subRole: (user.subRole as any) ?? undefined,
        farmId: user.farmId ?? undefined,
        avatar: user.avatar ?? undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const token = this.jwtService.sign({ sub: user.id, role: user.role });
      return { token, user };
    } catch {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }
}
