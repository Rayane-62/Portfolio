import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthAdmin, CurrentAdmin } from './auth.decorators';
import { ChangePasswordDto, LoginDto, UpdateProfileDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 10 tentatives par 15 minutes et par IP, pour freiner les essais de mot de passe. */
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.login, dto.password);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() me: AuthAdmin) {
    return me;
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  updateProfile(@CurrentAdmin() me: AuthAdmin, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(me, dto.firstName, dto.lastName, dto.login);
  }

  @Patch('password')
  @UseGuards(AdminAuthGuard)
  changePassword(@CurrentAdmin() me: AuthAdmin, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(me.id, dto.currentPassword, dto.newPassword);
  }
}
