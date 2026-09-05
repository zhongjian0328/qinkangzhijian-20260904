import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        role: true,
        subRole: true,
        avatar: true,
        farmId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }
}
