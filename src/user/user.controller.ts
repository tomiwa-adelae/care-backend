import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.getMe(req.user.id);
  }

  @Patch('password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.userService.getDashboardData(req.user.id);
  }
}
